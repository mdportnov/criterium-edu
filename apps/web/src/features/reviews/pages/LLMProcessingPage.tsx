import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { BulkOperationsService } from '@/services/bulk-operations.service';
import { TaskSolutionService } from '@/services/task-solution.service';
import { TaskService } from '@/services/task.service';
import type { LLMAssessmentRequest } from '@/types';
import { useQuery } from '@tanstack/react-query';

const LLMProcessingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    location.state?.taskId || '',
  );
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [llmModel, setLlmModel] = useState<string>('gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const { data: tasksResponse } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => TaskService.getTasks(),
  });
  
  const tasks = tasksResponse?.data || [];

  const { data: solutionsResponse } = useQuery({
    queryKey: ['task-solutions', selectedTaskId],
    queryFn: () =>
      selectedTaskId
        ? TaskSolutionService.getTaskSolutionsByTaskId(selectedTaskId)
        : [],
    enabled: !!selectedTaskId,
  });
  
  const solutions = Array.isArray(solutionsResponse) 
    ? solutionsResponse 
    : (solutionsResponse?.data || []);

  const { data: selectedTask } = useQuery({
    queryKey: ['task', selectedTaskId],
    queryFn: () => TaskService.getTaskById(selectedTaskId),
    enabled: !!selectedTaskId,
  });

  useEffect(() => {
    if (selectedTask && selectedTask.criteria) {
      const defaultPrompt = `You are an experienced educator evaluating student solutions. 

Assessment Criteria:
${selectedTask.criteria.map((c) => `- ${c.name} (${c.maxPoints} points): ${c.description}`).join('\n')}

Please provide:
1. A score for each criterion (0-${Math.max(...selectedTask.criteria.map((c) => c.maxPoints))})
2. Constructive feedback highlighting strengths and areas for improvement
3. Specific suggestions for improvement

Be fair, objective, and educational in your assessment.`;
      setSystemPrompt(defaultPrompt);
    }
  }, [selectedTask]);

  const handleSelectAll = () => {
    if (selectedSolutions.length === solutions.length) {
      setSelectedSolutions([]);
    } else {
      setSelectedSolutions(solutions.map((s) => s.id));
    }
  };

  const handleSolutionToggle = (solutionId: string) => {
    setSelectedSolutions((prev) =>
      prev.includes(solutionId)
        ? prev.filter((id) => id !== solutionId)
        : [...prev, solutionId],
    );
  };

  const handleStartProcessing = async () => {
    if (!selectedTaskId) {
      setError('Please select a task');
      return;
    }

    if (selectedSolutions.length === 0) {
      setError('Please select at least one solution');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      const request: LLMAssessmentRequest = {
        solutionIds: selectedSolutions.map(String),
        llmModel,
        taskId: selectedTaskId,
        systemPrompt,
      };

      const operation = await BulkOperationsService.startLLMAssessment(request);

      // Navigate to operation monitoring page
      navigate(`/dashboard/reviews/processing/${operation.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start LLM processing',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">LLM Assessment Processing</h1>
        <p className="text-muted-foreground mt-2">
          Configure and start automated assessment of student solutions
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Task & Solutions</CardTitle>
            <CardDescription>
              Choose the task and solutions to process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="task-select">Task</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger id="task-select">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={String(task.id)}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {solutions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Solutions ({solutions.length} available)</Label>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedSolutions.length === solutions.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                <div className="border rounded-md max-h-60 overflow-y-auto">
                  {solutions.map((solution) => (
                    <div
                      key={solution.id}
                      className="flex items-center space-x-3 p-3 border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSolutions.includes(solution.id)}
                        onChange={() => handleSolutionToggle(solution.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Student {solution.studentId || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {solution.solutionText?.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(solution.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {selectedSolutions.length} of {solutions.length} solutions
                  selected
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LLM Configuration</CardTitle>
            <CardDescription>
              Configure the AI model and assessment prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="llm-model">AI Model</Label>
              <Select value={llmModel} onValueChange={setLlmModel}>
                <SelectTrigger id="llm-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="Enter the system prompt for the AI assessment..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This prompt will guide how the AI evaluates each solution
              </p>
            </div>
          </CardContent>
        </Card>

        {selectedTask && (
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.title}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description}
                </p>
              </div>

              {selectedTask.criteria && selectedTask.criteria.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Assessment Criteria
                    </p>
                    <div className="space-y-2">
                      {selectedTask.criteria.map((criterion) => (
                        <div key={criterion.id} className="border rounded p-2">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">
                              {criterion.name}
                            </p>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {criterion.maxPoints} pts
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {criterion.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="flex gap-4">
          <Button
            onClick={handleStartProcessing}
            disabled={isProcessing || selectedSolutions.length === 0}
            className="flex-1"
          >
            {isProcessing
              ? 'Starting Processing...'
              : `Process ${selectedSolutions.length} Solutions`}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/reviews')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LLMProcessingPage;
