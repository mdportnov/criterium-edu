import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Alert } from '@/components/ui/alert';
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: TaskService.getTasks,
  });

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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bulk Solution Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload student solutions in bulk for processing and review
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Task</CardTitle>
            <CardDescription>
              Choose the task these solutions belong to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JSON Data</CardTitle>
            <CardDescription>
              Enter solutions in JSON format. Each solution should include
              studentName, studentId, and solutionContent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadSample}>
                Load Sample
              </Button>
            </div>

            <Textarea
              placeholder="Paste your JSON data here..."
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />

            {error && <Alert variant="destructive">{error}</Alert>}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedTaskId || !jsonData.trim()}
            className="flex-1"
          >
            {isUploading ? 'Uploading...' : 'Upload Solutions'}
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
