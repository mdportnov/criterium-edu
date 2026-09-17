import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Field } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { BulkOperationsService } from '@/services/bulk-operations.service';
import { TaskService } from '@/services/task.service';
import type { BulkImportSolution } from '@/types';
import { useQuery } from '@tanstack/react-query';

const BulkSolutionUploadPage = () => {
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [jsonData, setJsonData] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const { data: tasksResponse } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => TaskService.getTasks(),
  });

  const tasks = tasksResponse?.data || [];

  const sampleJson = [
    {
      studentName: 'John Doe',
      studentId: 'STU001',
      solutionContent: "console.log('Hello World');",
      taskId: selectedTaskId || 'task-uuid-here',
      notes: 'First submission',
    },
    {
      studentName: 'Jane Smith',
      studentId: 'STU002',
      solutionContent: "function hello() { return 'Hello World'; }",
      taskId: selectedTaskId || 'task-uuid-here',
    },
  ];

  const handleUpload = async () => {
    if (!selectedTaskId) {
      setError('Please select a task');
      return;
    }

    if (!jsonData.trim()) {
      setError('Please enter JSON data');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const solutions: BulkImportSolution[] = JSON.parse(jsonData);

      // Validate data structure
      for (const solution of solutions) {
        if (
          !solution.studentName ||
          !solution.studentId ||
          !solution.solutionContent
        ) {
          throw new Error('Invalid solution format: missing required fields');
        }
      }

      // Set task ID for all solutions
      const solutionsWithTask = solutions.map((s) => ({
        ...s,
        taskId: selectedTaskId,
      }));

      const operation =
        await BulkOperationsService.importSolutions(solutionsWithTask);

      navigate(`/dashboard/reviews/processing/${operation.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload solutions',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const loadSample = () => {
    setJsonData(JSON.stringify(sampleJson, null, 2));
  };

  return (
    <div>
      <PageHeader
        title="Bulk solution upload"
        description="Upload student solutions in bulk for processing and review."
        backTo="/dashboard/reviews"
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Select task</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent>
            <Field
              label="Task"
              htmlFor="task-select"
              hint="These solutions belong to the selected task."
            >
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>JSON data</CardTitle>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Solutions"
              htmlFor="json-data"
              hint="Each solution should include studentName, studentId and solutionContent."
            >
              <div className="mb-2">
                <Button variant="outline" size="sm" onClick={loadSample}>
                  Load sample
                </Button>
              </div>
              <Textarea
                id="json-data"
                placeholder="Paste your JSON data here…"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                rows={20}
                className="font-mono text-[13px]"
              />
            </Field>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedTaskId || !jsonData.trim()}
            className="flex-1"
          >
            {isUploading ? 'Uploading…' : 'Upload solutions'}
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

export default BulkSolutionUploadPage;
