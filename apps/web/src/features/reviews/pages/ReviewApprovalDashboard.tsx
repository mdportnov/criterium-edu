import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { TaskSolutionReviewService } from '@/services/task-solution-review.service';
import { TaskService } from '@/services/task.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ReviewApprovalDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('all');
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
        selectedTaskId === 'all' ? undefined : selectedTaskId,
        { page: currentPage, size: pageSize }
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
        text: `Approved ${result.approvedCount} reviews successfully${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`,
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
        text: `Rejected ${result.rejectedCount} reviews successfully${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`,
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
      setMessage({
        type: 'success',
        text: 'Review approved successfully',
      });
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
      setMessage({
        type: 'success',
        text: 'Review rejected successfully',
      });
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Approval Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve AI-generated feedback for student solutions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Reviews</CardTitle>
            <CardDescription>
              Filter by task or view all pending auto-generated reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="All tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={String(task.id)}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.text}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Reviews ({pendingReviews.length})</CardTitle>
                <CardDescription>
                  AI-generated reviews awaiting approval
                </CardDescription>
              </div>
              {pendingReviews.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedReviews.length === pendingReviews.length
                      ? 'Deselect All'
                      : 'Select All'}
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
          </CardHeader>
          <CardContent>
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending reviews found. All AI-generated reviews have been
                processed.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => handleReviewToggle(review.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">Review #{review.id}</h4>
                            <Badge variant="secondary">{review.source}</Badge>
                            <Badge variant="outline">
                              Score: {review.totalScore}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            Task Solution ID: {review.taskSolutionId}
                          </p>

                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">
                              Feedback to Student:
                            </p>
                            <p className="text-sm bg-gray-50 p-2 rounded">
                              {expandedReviews.has(review.id)
                                ? review.feedbackToStudent
                                : `${review.feedbackToStudent.substring(0, 200)}${review.feedbackToStudent.length > 200 ? '...' : ''}`}
                            </p>
                            {review.feedbackToStudent.length > 200 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => toggleExpanded(review.id)}
                                className="p-0 h-auto text-xs"
                              >
                                {expandedReviews.has(review.id)
                                  ? 'Show less'
                                  : 'Show more'}
                              </Button>
                            )}
                          </div>

                          {review.criteriaScores &&
                            review.criteriaScores.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">
                                  Criteria Scores:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {review.criteriaScores.map((score, index) => (
                                    <div
                                      key={index}
                                      className="text-xs bg-gray-50 p-1 rounded"
                                    >
                                      Criterion {score.criterionId}:{' '}
                                      {score.score} pts
                                      {score.comment && (
                                        <p className="text-muted-foreground mt-1">
                                          {score.comment}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <p className="text-xs text-muted-foreground">
                            Generated:{' '}
                            {new Date(review.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
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
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewApprovalDashboard;
