import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import {
  TaskSolutionStatus,
  type TaskSolution,
  type TaskSolutionReview,
} from '@/types';
import { TaskSolutionService, TaskSolutionReviewService } from '@/services';
import { UserRole } from '@app/shared/interfaces';
import { getErrorMessage } from '@/lib/errors';
import { TaskService } from '@/services/task.service';
import type { TaskCriterion } from '@/types';

const SolutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [solution, setSolution] = useState<TaskSolution | null>(null);
  const [criteria, setCriteria] = useState<TaskCriterion[]>([]);
  const [review, setReview] = useState<TaskSolutionReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isStudent = hasRole(UserRole.STUDENT);
  const isReviewer = hasRole(UserRole.REVIEWER);
  const isAdmin = hasRole(UserRole.ADMIN);
  const canReview = isReviewer || isAdmin;
  const isOwnSolution = solution?.studentId === user?.id;

  const fetchSolutionData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const solutionData = await TaskSolutionService.getTaskSolutionById(id);
      setSolution(solutionData);

      // The solution carries a task stub without criteria, so the names come
      // from the task itself. This screen used to read them off the stub and
      // silently fall through to "Criterion 1", "Criterion 2" every time.
      try {
        const task = await TaskService.getTaskById(solutionData.taskId);
        setCriteria(task.criteria);
      } catch {
        setCriteria([]);
      }

      // Check if there's a review for this solution
      try {
        const reviews =
          await TaskSolutionReviewService.getTaskSolutionReviewsBySolutionId(
            id,
          );
        const reviewsArray = Array.isArray(reviews) ? reviews : reviews.data;
        if (reviewsArray.length > 0) {
          setReview(reviewsArray[0]);
        }
      } catch (reviewErr) {
        console.error('Error fetching review:', reviewErr);
        // Don't set an error for review fetch failure
      }
    } catch (err) {
      console.error('Error fetching solution:', err);
      setError(
        getErrorMessage(err, 'Failed to load solution. Please try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchSolutionData();
  }, [fetchSolutionData]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Solution" backTo="/tasks" />
        <Card>
          <LoadingState label="Loading solution…" />
        </Card>
      </div>
    );
  }

  if (error || !solution) {
    return (
      <div>
        <PageHeader title="Solution" backTo="/tasks" />
        <ErrorState
          title="Could not load the solution"
          message={error || 'Solution not found'}
          onRetry={() => void fetchSolutionData()}
        />
      </div>
    );
  }

  // Only allow access to the solution owner, reviewers, or admins
  if (!isOwnSolution && !canReview) {
    return (
      <div>
        <PageHeader title="Solution" backTo="/tasks" />
        <Card>
          <EmptyState
            title="You don't have permission to view this solution"
            description="Only the student who submitted it, reviewers and admins can open it."
            action={
              <Button asChild variant="outline">
                <Link to="/tasks">Back to tasks</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const getTotalScore = () => {
    if (!review) return 0;

    return review.criteriaScores.reduce(
      (total, score) => total + score.score,
      0,
    );
  };

  const getMaxPossibleScore = () => {
    if (!review) return 0;

    return review.totalScore;
  };

  const getScorePercentage = () => {
    const maxScore = getMaxPossibleScore();
    if (maxScore === 0) return 0;

    return (getTotalScore() / maxScore) * 100;
  };

  const getCriterionTitle = (criterionId: string, index: number) =>
    criteria.find((criterion) => criterion.id === criterionId)?.name ||
    `Criterion ${index + 1}`;

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <PageHeader
        title={`Solution #${solution.id}`}
        description={
          <>
            <Link
              to={`/dashboard/tasks/${solution.taskId}`}
              className="hover:text-foreground"
            >
              Task #{solution.taskId}
            </Link>
          </>
        }
        backTo="/tasks"
        actions={
          <>
            {canReview && solution.status !== TaskSolutionStatus.REVIEWED && (
              <Button asChild>
                <Link to={`/dashboard/solutions/${solution.id}/review`}>
                  {solution.status === TaskSolutionStatus.IN_REVIEW
                    ? 'Continue review'
                    : 'Start review'}
                </Link>
              </Button>
            )}
            {isStudent && isOwnSolution && (
              <Button asChild variant="outline">
                <Link
                  to={`/dashboard/tasks/${solution.taskId}/submit-solution`}
                >
                  Submit new solution
                </Link>
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
                <CardTitle>Solution</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <pre className="code-block">
                <code>{solution.solutionText}</code>
              </pre>
            </CardContent>
          </Card>

          {review && (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Review</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Criteria evaluation
                  </h3>

                  {review.criteriaScores.map((score, index) => (
                    <div
                      key={score.criterionId ?? index}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium text-foreground">
                          {getCriterionTitle(score.criterionId, index)}
                        </p>
                        <span className="shrink-0 tabular-nums text-[13px] font-medium text-foreground">
                          {score.score} pts
                        </span>
                      </div>
                      {score.comment && (
                        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                          {score.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Overall feedback
                  </h3>
                  <div className="prose-body">{review.feedbackToStudent}</div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reviewed on {formatDateTime(review.updatedAt)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:self-start">
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Details</CardTitle>
            </CardHeaderText>
            <CardAction>
              <StatusBadge status={solution.status} />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {review && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Score
                </h3>
                <p className="mt-0.5 tabular-nums text-[13px] font-medium text-foreground">
                  {getTotalScore()} / {getMaxPossibleScore()} (
                  {getScorePercentage().toFixed(1)}%)
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-medium text-muted-foreground">
                Submitted by
              </h3>
              <p className="mt-0.5 text-[13px] text-foreground">
                Student #{solution.studentId}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground">
                Submitted on
              </h3>
              <p className="mt-0.5 text-[13px] text-foreground">
                {formatDateTime(solution.submittedAt)}
              </p>
            </div>

            {solution.updatedAt !== solution.submittedAt && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Last updated
                </h3>
                <p className="mt-0.5 text-[13px] text-foreground">
                  {formatDateTime(solution.updatedAt)}
                </p>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <Button asChild variant="outline" className="w-full">
                <Link to={`/dashboard/tasks/${solution.taskId}`}>
                  View task
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SolutionDetailPage;
