import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { TaskSolutionReviewService } from '@/services/task-solution-review.service';
import { TaskService } from '@/services/task.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReviewSource } from '@/types';

const ALL = 'all';

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

const ReviewApprovalDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(ALL);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set(),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => TaskService.getTasks({ page: 1, size: 100 }),
  });

  const { data: pendingReviewsData, refetch } = useQuery({
    queryKey: ['pending-auto-reviews', selectedTaskId, currentPage, pageSize],
    queryFn: () =>
      TaskSolutionReviewService.getPendingAutoReviews(
        selectedTaskId === ALL ? undefined : selectedTaskId,
        { page: currentPage, size: pageSize },
      ),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const tasks = tasksData?.data || [];
  const pendingReviews = pendingReviewsData?.data || [];
  const totalPages = pendingReviewsData?.totalPages || 0;
  const total = pendingReviewsData?.total || 0;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === pendingReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(pendingReviews.map((review) => review.id));
    }
  };

  const handleReviewToggle = (reviewId: string) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId],
    );
  };

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const handleBatchApprove = async () => {
    if (selectedReviews.length === 0) return;

    try {
      setIsProcessing(true);
      const result =
        await TaskSolutionReviewService.batchApproveReviews(selectedReviews);

      setMessage({
        type: 'success',
        text: `Approved ${result.approvedCount} reviews${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`,
      });

      setSelectedReviews([]);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['task-solution-reviews'] });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to approve reviews',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedReviews.length === 0) return;

    try {
      setIsProcessing(true);
      const result =
        await TaskSolutionReviewService.batchRejectReviews(selectedReviews);

      setMessage({
        type: 'success',
        text: `Rejected ${result.rejectedCount} reviews${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`,
      });

      setSelectedReviews([]);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['task-solution-reviews'] });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reject reviews',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndividualApprove = async (reviewId: string) => {
    try {
      await TaskSolutionReviewService.approveAutoReview(reviewId);
      setMessage({ type: 'success', text: 'Review approved.' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['task-solution-reviews'] });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to approve review',
      });
    }
  };

  const handleIndividualReject = async (reviewId: string) => {
    try {
      await TaskSolutionReviewService.rejectAutoReview(reviewId);
      setMessage({ type: 'success', text: 'Review rejected.' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['task-solution-reviews'] });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reject review',
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <PageHeader
        title="Approval queue"
        description={
          total === 1
            ? '1 AI-generated review awaiting approval'
            : `${total} AI-generated reviews awaiting approval`
        }
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'success'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card>
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger aria-label="Task" className="sm:w-[16rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All tasks</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={String(task.id)}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {pendingReviews.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedReviews.length === pendingReviews.length
                    ? 'Deselect all'
                    : 'Select all'}
                </Button>
                {selectedReviews.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleBatchApprove}
                      disabled={isProcessing}
                    >
                      Approve {selectedReviews.length}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchReject}
                      disabled={isProcessing}
                    >
                      Reject {selectedReviews.length}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {pendingReviews.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing to approve"
              description="Every AI-generated review has been processed."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pendingReviews.map((review) => {
                const isExpanded = expandedReviews.has(review.id);
                const isLong = review.feedbackToStudent.length > 200;
                return (
                  <li key={review.id} className="flex items-start gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => handleReviewToggle(review.id)}
                      aria-label={`Select review ${review.id}`}
                      className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[13px] font-medium text-foreground">
                          Review #{review.id}
                        </h4>
                        <Badge variant={SOURCE_TONES[review.source]}>
                          {SOURCE_LABELS[review.source]}
                        </Badge>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          Score: {review.totalScore}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Task solution #{review.taskSolutionId}
                      </p>

                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Feedback to student
                        </p>
                        <p className="mt-1 rounded-md border border-border bg-muted/50 p-2 text-[13px] leading-5 text-foreground">
                          {isExpanded || !isLong
                            ? review.feedbackToStudent
                            : `${review.feedbackToStudent.substring(0, 200)}…`}
                        </p>
                        {isLong && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleExpanded(review.id)}
                            className="h-auto p-0 text-xs"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </div>

                      {review.criteriaScores &&
                        review.criteriaScores.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              Criteria scores
                            </p>
                            <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              {review.criteriaScores.map((score, index) => (
                                <div
                                  key={index}
                                  className="rounded-md border border-border p-1.5 text-xs text-foreground"
                                >
                                  Criterion {score.criterionId}:{' '}
                                  <span className="tabular-nums">
                                    {score.score} pts
                                  </span>
                                  {score.comment && (
                                    <p className="mt-1 text-muted-foreground">
                                      {score.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <p className="text-xs text-muted-foreground">
                        Generated {formatDateTime(review.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleIndividualApprove(review.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleIndividualReject(review.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReviewApprovalDashboard;
