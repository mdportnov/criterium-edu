import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { type Task, type TaskSolution, UserRole } from '@/types';
import { TaskService, TaskSolutionService } from '@/services';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [mySolutions, setMySolutions] = useState<TaskSolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isStudent = hasRole(UserRole.STUDENT);
  const isAdminOrReviewer = hasRole([UserRole.ADMIN, UserRole.REVIEWER]);

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError('');

      try {
        const taskId = parseInt(id, 10);
        const taskData = await TaskService.getTaskById(taskId);
        setTask(taskData);

        // If user is a student, fetch their solutions for this task
        if (isStudent && user) {
          const solutions =
            await TaskSolutionService.getTaskSolutionsByTaskId(taskId);
          const userSolutions = solutions.filter(
            (solution) => solution.studentId === user.id,
          );
          setMySolutions(userSolutions);
        }
      } catch (err) {
        console.error('Error fetching task data:', err);
        setError('Failed to load task details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [id, isStudent, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error || 'Task not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link to="/dashboard/tasks" className="hover:text-primary">
              Tasks
            </Link>
            <span>/</span>
            <span>Task #{task.id}</span>
          </div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
        </div>

        <div className="flex gap-2">
          {isStudent && (
            <Button asChild>
              <Link to={`/dashboard/tasks/${task.id}/submit-solution`}>
                {mySolutions.length > 0 ? 'Submit New Solution' : 'Solve Task'}
              </Link>
            </Button>
          )}

          {isAdminOrReviewer && (
            <Button asChild variant="outline">
              <Link to={`/dashboard/tasks/${task.id}/edit`}>Edit Task</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Task Description */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line">{task.description}</p>
            </div>
          </div>

          {/* Task Criteria */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Evaluation Criteria</h2>

            {task.criteria.length === 0 ? (
              <p className="text-muted-foreground">
                No criteria specified for this task.
              </p>
            ) : (
              <div className="space-y-6">
                {task.criteria.map((criterion, index) => (
                  <div
                    key={criterion.id || index}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{criterion.name}</h3>
                      <span className="bg-primary/10 text-primary text-sm px-2 py-1 rounded">
                        {criterion.maxPoints} points
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Author Solution (only visible to admin/reviewer) */}
          {isAdminOrReviewer && task.authorSolution && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Author Solution</h2>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{task.authorSolution}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Task Metadata */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Task Details</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Created
                </h3>
                <p className="mt-1">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </h3>
                <p className="mt-1">
                  {new Date(task.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {task.categories && task.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.categories.map((category) => (
                      <span
                        key={category}
                        className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* My Solutions (only for students) */}
          {isStudent && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">My Solutions</h2>

              {mySolutions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any solutions yet.
                  </p>
                  <Button asChild>
                    <Link to={`/dashboard/tasks/${task.id}/submit-solution`}>
                      Solve Task
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySolutions.map((solution) => (
                    <div
                      key={solution.id}
                      className="border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <Link
                          to={`/solutions/${solution.id}`}
                          className="font-medium hover:text-primary"
                        >
                          Solution #{solution.id}
                        </Link>
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded ${
                            solution.status === 'reviewed'
                              ? 'bg-green-100 text-green-800'
                              : solution.status === 'in_review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {solution.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted:{' '}
                        {new Date(solution.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
