import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Badge, StatusBadge, type BadgeTone } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Separator } from '@/components/ui/separator';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TaskSolutionReviewService, TaskSolutionService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { ReviewSource, TaskSolution, TaskSolutionReview } from '@/types';
import { UserRole } from '@app/shared';
import { CheckCircle, Edit, FileText, Trash2 } from 'lucide-react';

const SOURCE_TONES: Record<ReviewSource, BadgeTone> = {
  auto: 'info',
  manual: 'accent',
  auto_approved: 'success',
  auto_modified: 'warning',
};

const SOURCE_LABELS: Record<ReviewSource, string> = {
  auto: 'Auto review',
  manual: 'Manual review',
  auto_approved: 'Auto approved',
  auto_modified: 'Auto modified',
};

const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [review, setReview] = useState<TaskSolutionReview | null>(null);
  const [taskSolution, setTaskSolution] = useState<TaskSolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReview(id);
    }
  }, [id]);

  const fetchReview = async (reviewId: string) => {
    try {
      setLoading(true);
      setError('');
      const reviewData =
        await TaskSolutionReviewService.getReviewById(reviewId);
      setReview(reviewData);

      const solutionData = await TaskSolutionService.getTaskSolutionById(
        reviewData.taskSolutionId,
      );
      setTaskSolution(solutionData);
    } catch {
      setError('The review service did not respond.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async () => {
    if (!review || review.source !== 'auto') return;

    try {
      setActionLoading(true);
      const updatedReview = await TaskSolutionReviewService.approveAutoReview(
        review.id,
      );
      setReview(updatedReview);
    } catch {
      setError('Failed to approve the review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (
      !review ||
      !window.confirm('Are you sure you want to delete this review?')
    )
      return;

    try {
      setActionLoading(true);
      await TaskSolutionReviewService.deleteReview(review.id);
      navigate('/dashboard/reviews');
    } catch {
      setError('Failed to delete the review.');
      setActionLoading(false);
    }
  };

  const canEditReview =
    user &&
    (user.role === UserRole.ADMIN ||
      (user.role === UserRole.REVIEWER && review?.reviewerId === user.id));

  const canDeleteReview = user?.role === UserRole.ADMIN;
  const canApproveReview =
    review?.source === 'auto' &&
    (user?.role === UserRole.ADMIN || user?.role === UserRole.REVIEWER);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div>
        <PageHeader title="Review" backTo="/dashboard/reviews" />
        <LoadingState />
      </div>
    );
  }

  if (error && !review) {
    return (
      <div>
        <PageHeader title="Review" backTo="/dashboard/reviews" />
        <ErrorState
          title="Could not load this review"
          message={error}
          onRetry={() => id && fetchReview(id)}
        />
      </div>
    );
  }

  if (!review) {
    return (
      <div>
        <PageHeader title="Review" backTo="/dashboard/reviews" />
        <ErrorState title="Review not found" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Review #${review.id}`}
        description={`Created ${formatDate(review.createdAt)} · Updated ${formatDate(review.updatedAt)}`}
        backTo="/dashboard/reviews"
        actions={
          <>
            {canApproveReview && (
              <Button onClick={handleApproveReview} disabled={actionLoading}>
                <CheckCircle className="size-4" />
                Approve auto review
              </Button>
            )}
            {canEditReview && (
              <Button asChild variant="outline">
                <Link to={`/dashboard/reviews/${review.id}/edit`}>
                  <Edit className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canDeleteReview && (
              <Button
                variant="destructive"
                onClick={handleDeleteReview}
                disabled={actionLoading}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </>
        }
      />

      {error && (
        <ErrorState
          className="mb-4"
          title="Something went wrong"
          message={error}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Overview</CardTitle>
              </CardHeaderText>
              <CardAction>
                <Badge variant={SOURCE_TONES[review.source]}>
                  {SOURCE_LABELS[review.source]}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total score
                  </p>
                  <p className="mt-1 text-2xl font-semibold leading-8 tracking-tight tabular-nums text-foreground">
                    {review.totalScore}
                  </p>
                </div>
                {review.reviewerId && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Reviewer
                    </p>
                    <p className="mt-1 text-[13px] text-foreground">
                      {review.reviewerId}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-[13px] font-semibold text-foreground">
                  Feedback to student
                </h3>
                <div className="prose-body mt-2 rounded-md border border-border bg-muted/50 p-3">
                  <p className="whitespace-pre-wrap text-[13px] leading-5 text-foreground">
                    {review.feedbackToStudent}
                  </p>
                </div>
              </div>

              {review.reviewerComment && (
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Reviewer comment
                  </h3>
                  <div className="prose-body mt-2 rounded-md border border-border bg-muted/50 p-3">
                    <p className="whitespace-pre-wrap text-[13px] leading-5 text-foreground">
                      {review.reviewerComment}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[13px] font-semibold text-foreground">
                  Criteria scores
                </h3>
                <div className="mt-2 space-y-2">
                  {review.criteriaScores.map((criterionScore, index) => (
                    <div
                      key={index}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-foreground">
                          Criterion #{criterionScore.criterionId}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums text-foreground">
                          {criterionScore.score} points
                        </span>
                      </div>
                      {criterionScore.comment && (
                        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                          {criterionScore.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {taskSolution && (
            <Card>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Task solution</CardTitle>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Solution
                    </span>
                    <span className="text-[13px] font-medium text-foreground">
                      #{taskSolution.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Task</span>
                    <span className="text-[13px] font-medium text-foreground">
                      {taskSolution.task?.title || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Status
                    </span>
                    <StatusBadge status={taskSolution.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Submitted
                    </span>
                    <span className="text-[13px] text-foreground">
                      {formatDate(taskSolution.submittedAt)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/dashboard/solutions/${taskSolution.id}`}>
                    <FileText className="size-4" />
                    View solution
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
