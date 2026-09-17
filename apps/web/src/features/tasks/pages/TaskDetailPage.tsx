import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardHeaderText,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { type Task, type TaskSolution } from '@/types';
import { TaskService, TaskSolutionService } from '@/services';
import { UserRole } from '@app/shared/interfaces';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [mySolutions, setMySolutions] = useState<TaskSolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isStudent = hasRole(UserRole.STUDENT);
  const isAdminOrReviewer = hasRole([UserRole.ADMIN, UserRole.REVIEWER]);

  const fetchTaskData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const taskData = await TaskService.getTaskById(id);
      setTask(taskData);

      // If user is a student, fetch their solutions for this task
      if (isStudent && user) {
        const solutions =
          await TaskSolutionService.getTaskSolutionsByTaskId(id);
        const solutionsArray = Array.isArray(solutions)
          ? solutions
          : solutions.data;
        const userSolutions = solutionsArray.filter(
          (solution: TaskSolution) => solution.studentId === user.id,
        );
        setMySolutions(userSolutions);
      }
    } catch (err) {
      console.error('Error fetching task data:', err);
      setError('Failed to load task details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [id, isStudent, user]);

  useEffect(() => {
    void fetchTaskData();
  }, [fetchTaskData]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Task" backTo="/dashboard/tasks" />
        <LoadingState label="Loading task…" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div>
        <PageHeader title="Task" backTo="/dashboard/tasks" />
        <ErrorState
          title="Could not load task"
          message={error || 'Task not found'}
          onRetry={() => void fetchTaskData()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={task.title}
        description={`Task #${task.id}`}
        backTo="/dashboard/tasks"
        actions={
          <>
            {isStudent && (
              <Button asChild>
                <Link to={`/dashboard/tasks/${task.id}/submit-solution`}>
                  {mySolutions.length > 0
                    ? 'Submit New Solution'
                    : 'Solve Task'}
                </Link>
              </Button>
            )}
            {isAdminOrReviewer && (
              <Button asChild variant="outline">
                <Link to={`/dashboard/tasks/${task.id}/edit`}>Edit Task</Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Description</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <div className="prose-body">{task.description}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Evaluation criteria</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              {task.criteria.length === 0 ? (
                <EmptyState title="No criteria specified for this task." />
              ) : (
                <div className="space-y-3">
                  {task.criteria.map((criterion, index) => (
                    <div
                      key={criterion.id || index}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className="text-[13px] font-medium text-foreground">
                          {criterion.name}
                        </h3>
                        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                          {criterion.maxPoints} pts
                        </span>
                      </div>
                      <p className="text-[13px] text-muted-foreground">
                        {criterion.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isAdminOrReviewer && task.authorSolution && (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Author solution</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent>
                <pre className="code-block">
                  <code>{task.authorSolution}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Task details</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Created
                </h3>
                <p className="mt-0.5 text-[13px] tabular-nums text-foreground">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Last updated
                </h3>
                <p className="mt-0.5 text-[13px] tabular-nums text-foreground">
                  {new Date(task.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {task.categories && task.categories.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Categories
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {task.categories.map((category) => (
                      <Badge key={category} variant="accent">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Tags
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isStudent && (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>My solutions</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent>
                {mySolutions.length === 0 ? (
                  <EmptyState
                    title="No solutions submitted yet"
                    description="Submit your solution to this task to see it here."
                    action={
                      <Button asChild size="sm">
                        <Link
                          to={`/dashboard/tasks/${task.id}/submit-solution`}
                        >
                          Solve Task
                        </Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {mySolutions.map((solution) => (
                      <div
                        key={solution.id}
                        className="border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <Link
                            to={`/solutions/${solution.id}`}
                            className="text-[13px] font-medium text-foreground hover:text-primary"
                          >
                            Solution #{solution.id}
                          </Link>
                          <StatusBadge status={solution.status} />
                        </div>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          Submitted:{' '}
                          {new Date(solution.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
