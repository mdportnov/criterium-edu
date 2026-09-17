import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import {
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui/table';
import { TaskSolutionReviewService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type {
  PaginatedResponse,
  ReviewSource,
  TaskSolutionReview,
} from '@/types';
import {
  Activity,
  Brain,
  CheckCircle,
  FileText,
  Plus,
  Search,
  Upload,
} from 'lucide-react';

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

const ReviewsPage: React.FC = () => {
  const [paginatedData, setPaginatedData] =
    useState<PaginatedResponse<TaskSolutionReview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>(ALL);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const taskId = searchParams.get('taskId');
      const taskSolutionId = searchParams.get('taskSolutionId');

      let data: PaginatedResponse<TaskSolutionReview>;
      const pagination = { page: currentPage, size: pageSize };

      if (taskId) {
        data = await TaskSolutionReviewService.getReviewsByTaskId(
          taskId,
          pagination,
        );
      } else if (taskSolutionId) {
        data = await TaskSolutionReviewService.getReviewsByTaskSolutionId(
          taskSolutionId,
          pagination,
        );
      } else {
        data = await TaskSolutionReviewService.getReviews(pagination);
      }

      setPaginatedData(data);
    } catch {
      setError('The review service did not respond.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchParams]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const reviews = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 0;
  const total = paginatedData?.total || 0;

  const filteredReviews = reviews
    .filter((review) => sourceFilter === ALL || review.source === sourceFilter)
    .filter((review) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        review.feedbackToStudent.toLowerCase().includes(term) ||
        review.reviewerComment?.toLowerCase().includes(term) ||
        review.taskSolutionId.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'score-high':
          return b.totalScore - a.totalScore;
        case 'score-low':
          return a.totalScore - b.totalScore;
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const hasFilters = Boolean(searchTerm) || sourceFilter !== ALL;

  const clearFilters = () => {
    setSearchTerm('');
    setSourceFilter(ALL);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const canCreateReview = user?.role === 'admin' || user?.role === 'reviewer';

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={
          total === 1 ? '1 review recorded' : `${total} reviews recorded`
        }
        actions={
          canCreateReview && (
            <>
              <Button asChild variant="outline">
                <Link to="/dashboard/reviews/bulk-upload">
                  <Upload className="size-4" />
                  Bulk upload
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard/reviews/llm-processing">
                  <Brain className="size-4" />
                  LLM assessment
                </Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard/reviews/create">
                  <Plus className="size-4" />
                  New review
                </Link>
              </Button>
            </>
          )
        }
      />

      <div className="space-y-4">
        {canCreateReview && (
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>System operations</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  to="/dashboard/reviews/processing-status"
                  className="flex items-start gap-2.5 rounded-md border border-border p-3 hover:bg-muted/50"
                >
                  <Activity
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      Processing status
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Active bulk and AI operations
                    </p>
                  </div>
                </Link>
                <Link
                  to="/dashboard/reviews/approval-dashboard"
                  className="flex items-start gap-2.5 rounded-md border border-border p-3 hover:bg-muted/50"
                >
                  <CheckCircle
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      Pending approvals
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Review AI-generated feedback
                    </p>
                  </div>
                </Link>
                <Link
                  to="/dashboard/reviews/llm-processing"
                  className="flex items-start gap-2.5 rounded-md border border-border p-3 hover:bg-muted/50"
                >
                  <Brain
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      AI assessment
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Configure LLM-driven reviews
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {error ? (
          <ErrorState
            title="Could not load reviews"
            message={error}
            onRetry={fetchReviews}
          />
        ) : (
          <Card>
            <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Filter by feedback or comment"
                  aria-label="Filter reviews"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger aria-label="Source" className="sm:w-[11rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All sources</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto_approved">Auto approved</SelectItem>
                  <SelectItem value="auto_modified">Auto modified</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger aria-label="Sort" className="sm:w-[10rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="score-high">Highest score</SelectItem>
                  <SelectItem value="score-low">Lowest score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <TableSkeleton rows={8} columns={5} />
            ) : filteredReviews.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={
                  hasFilters
                    ? 'No reviews match these filters'
                    : 'No reviews yet'
                }
                description={
                  hasFilters
                    ? 'Try a shorter search term, or clear the source filter.'
                    : 'A review holds the score, criteria breakdown and feedback for one submission.'
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : canCreateReview ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/dashboard/reviews/create">
                        <Plus className="size-4" />
                        New review
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <tr>
                      <Th>Review</Th>
                      <Th>Source</Th>
                      <Th className="hidden md:table-cell">Feedback</Th>
                      <Th numeric className="w-24">
                        Score
                      </Th>
                      <Th className="hidden sm:table-cell">Date</Th>
                      <Th className="w-px text-right">
                        <span className="sr-only">Actions</span>
                      </Th>
                    </tr>
                  </THead>
                  <TBody>
                    {filteredReviews.map((review) => (
                      <Tr key={review.id}>
                        <Td>
                          <Link
                            to={`/dashboard/reviews/${review.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            Review #{review.id}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Solution #{review.taskSolutionId}
                          </p>
                        </Td>
                        <Td>
                          <Badge variant={SOURCE_TONES[review.source]}>
                            {SOURCE_LABELS[review.source]}
                          </Badge>
                        </Td>
                        <Td className="hidden max-w-xs md:table-cell">
                          <p className="line-clamp-2 text-muted-foreground">
                            {review.feedbackToStudent}
                          </p>
                        </Td>
                        <Td numeric>{review.totalScore}</Td>
                        <Td className="hidden text-muted-foreground sm:table-cell">
                          {formatDate(review.createdAt)}
                        </Td>
                        <Td className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/dashboard/reviews/${review.id}`}>
                              View
                            </Link>
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>
            )}

            {!loading && filteredReviews.length > 0 && totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
