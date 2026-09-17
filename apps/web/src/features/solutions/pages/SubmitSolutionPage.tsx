import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TaskService, TaskSolutionService } from '@/services';
import type { CreateTaskSolutionRequest, Task } from '@/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

const SubmitSolutionPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateTaskSolutionRequest>({
    taskId: '',
    solutionText: '',
  });

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError('');

    try {
      const taskData = await TaskService.getTaskById(taskId);
      setTask(taskData);
      setFormData((prev) => ({ ...prev, taskId }));
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(getErrorMessage(err, 'Failed to load task. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void fetchTask();
  }, [fetchTask]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.solutionText.trim()) {
      setError('Solution is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const solution = await TaskSolutionService.createTaskSolution(formData);
      setSuccess('Solution submitted successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/dashboard/solutions/${solution.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error submitting solution:', err);
      setError(
        getErrorMessage(err, 'Failed to submit solution. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Submit Solution" backTo="/dashboard/tasks" />
        <LoadingState />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Submit Solution" backTo="/dashboard/tasks" />
        <ErrorState
          title="Could not load task"
          message={error}
          onRetry={() => void fetchTask()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Submit Solution"
        description={task?.title ? `For "${task.title}"` : undefined}
        backTo={`/dashboard/tasks/${taskId}`}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle2 className="size-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={(e) => void handleSubmit(e)} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Your Solution</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Solution Code" htmlFor="solutionText" required>
                <Textarea
                  id="solutionText"
                  name="solutionText"
                  value={formData.solutionText}
                  onChange={handleChange}
                  placeholder="Enter your solution code here..."
                  className="min-h-64 font-mono"
                  required
                />
              </Field>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  navigate(`/dashboard/tasks/${taskId}`);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </Button>
            </CardFooter>
          </Card>
        </form>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Task Information</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Title
                </h3>
                <p className="mt-1 text-[13px] font-medium">{task?.title}</p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Description
                </h3>
                <div className="prose-body mt-1 line-clamp-4 text-[13px]">
                  {task?.description}
                </div>
                <Button
                  asChild
                  variant="link"
                  className="px-0 h-auto text-[13px]"
                >
                  <Link to={`/dashboard/tasks/${taskId}`}>View Full Task</Link>
                </Button>
              </div>

              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Evaluation Criteria
                </h3>
                <ul className="mt-1 space-y-2 text-[13px]">
                  {task?.criteria.map((criterion, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{criterion.name}</span>
                      <span className="font-medium tabular-nums">
                        {criterion.maxPoints} points
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmitSolutionPage;
