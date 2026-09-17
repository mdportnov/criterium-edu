import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeaderText,
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
import { Field, Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
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
    : solutionsResponse?.data || [];

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
    <div>
      <PageHeader
        title="LLM assessment"
        description="Configure and start automated assessment of student solutions."
        backTo="/dashboard/reviews"
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Select task &amp; solutions</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Task" htmlFor="task-select">
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
            </Field>

            {solutions.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Solutions ({solutions.length} available)</Label>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedSolutions.length === solutions.length
                      ? 'Deselect all'
                      : 'Select all'}
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-md border border-border">
                  {solutions.map((solution) => (
                    <div
                      key={solution.id}
                      className="flex items-center gap-3 border-b border-border p-3 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSolutions.includes(solution.id)}
                        onChange={() => handleSolutionToggle(solution.id)}
                        aria-label={`Select solution ${solution.id}`}
                        className="size-4 shrink-0 rounded border-border accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground">
                          Student {solution.studentId || 'Unknown'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {solution.solutionText?.substring(0, 100)}…
                        </p>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {new Date(solution.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {selectedSolutions.length} of {solutions.length} solutions
                  selected
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>LLM configuration</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="AI model" htmlFor="llm-model">
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
            </Field>

            <Field
              label="System prompt"
              htmlFor="system-prompt"
              hint="This prompt will guide how the AI evaluates each solution."
            >
              <Textarea
                id="system-prompt"
                placeholder="Enter the system prompt for the AI assessment…"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={12}
                className="font-mono text-[13px]"
              />
            </Field>
          </CardContent>
        </Card>

        {selectedTask && (
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Task information</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-foreground">Title</p>
                <p className="text-[13px] text-muted-foreground">
                  {selectedTask.title}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-foreground">
                  Description
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {selectedTask.description}
                </p>
              </div>

              {selectedTask.criteria && selectedTask.criteria.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">
                      Assessment criteria
                    </p>
                    <div className="space-y-2">
                      {selectedTask.criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="rounded-md border border-border p-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-medium text-foreground">
                              {criterion.name}
                            </p>
                            <Badge>{criterion.maxPoints} pts</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleStartProcessing}
            disabled={isProcessing || selectedSolutions.length === 0}
            className="flex-1"
          >
            {isProcessing
              ? 'Starting…'
              : `Process ${selectedSolutions.length} solutions`}
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
