import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskService, TaskSolutionService } from '@/services';
import type { CreateTaskSolutionRequest, Task } from '@/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const SubmitSolutionPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateTaskSolutionRequest>({
    taskId: 0,
    solution: '',
    notes: '',
  });

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      setIsLoading(true);
      setError('');

      try {
        const id = parseInt(taskId, 10);
        const taskData = await TaskService.getTaskById(id);
        setTask(taskData);
        setFormData((prev) => ({ ...prev, taskId: id }));
      } catch (err: any) {
        console.error('Error fetching task:', err);
        setError(
          err.response?.data?.message ||
            'Failed to load task. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.solution.trim()) {
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
    } catch (err: any) {
      console.error('Error submitting solution:', err);
      setError(
        err.response?.data?.message ||
          'Failed to submit solution. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Link to="/dashboard/tasks" className="hover:text-primary">
          Tasks
        </Link>
        <span>/</span>
        <Link to={`/dashboard/tasks/${taskId}`} className="hover:text-primary">
          Task #{taskId}
        </Link>
        <span>/</span>
        <span>Submit Solution</span>
      </div>

      <h1 className="text-3xl font-bold mb-6">Submit Solution</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Your Solution</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="solution">Solution Code</Label>
                  <textarea
                    id="solution"
                    name="solution"
                    value={formData.solution}
                    onChange={handleChange}
                    placeholder="Enter your solution code here..."
                    className="flex min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any additional notes or explanations about your solution..."
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/tasks/${taskId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </Button>
            </div>
          </form>
        </div>

        <div>
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Task Information</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Title
                </h3>
                <p className="mt-1 font-medium">{task?.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="mt-1 text-sm line-clamp-4">{task?.description}</p>
                <Button asChild variant="link" className="px-0 text-sm h-auto">
                  <Link to={`/dashboard/tasks/${taskId}`}>View Full Task</Link>
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Evaluation Criteria
                </h3>
                <ul className="mt-1 space-y-2 text-sm">
                  {task?.criteria.map((criterion, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{criterion.name}</span>
                      <span className="font-medium">
                        {criterion.maxPoints} points
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSolutionPage;
