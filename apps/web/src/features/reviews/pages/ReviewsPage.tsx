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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskSolutionReviewService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { PaginatedResponse, ReviewSource, TaskSolutionReview } from '@/types';
import {
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle,
  FileText,
  Plus,
  Search,
  Settings,
  Star,
  Upload,
  User,
} from 'lucide-react';

const ReviewsPage: React.FC = () => {
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<TaskSolutionReview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const taskId = searchParams.get('taskId');
      const taskSolutionId = searchParams.get('taskSolutionId');

      let data: PaginatedResponse<TaskSolutionReview>;
      const pagination = { page: currentPage, size: pageSize };

      if (taskId) {
        data = await TaskSolutionReviewService.getReviewsByTaskId(
          taskId,
          pagination
        );
      } else if (taskSolutionId) {
        data = await TaskSolutionReviewService.getReviewsByTaskSolutionId(
          taskSolutionId,
          pagination
        );
      } else {
        data = await TaskSolutionReviewService.getReviews(pagination);
      }

      setPaginatedData(data);
    } catch {
      setError('Failed to load reviews');
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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getSourceBadge = (source: ReviewSource) => {
    const variants = {
      auto: 'bg-blue-100 text-blue-800',
      manual: 'bg-green-100 text-green-800',
      auto_approved: 'bg-purple-100 text-purple-800',
      auto_modified: 'bg-orange-100 text-orange-800',
    };

    const labels = {
      auto: 'Auto Review',
      manual: 'Manual Review',
      auto_approved: 'Auto Approved',
      auto_modified: 'Auto Modified',
    };

    return <Badge className={variants[source]}>{labels[source]}</Badge>;
  };

  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canCreateReview = user?.role === 'admin' || user?.role === 'reviewer';

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">
            Manage task solution reviews and assessments
          </p>
        </div>
        {canCreateReview && (
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild>
                    <Link to="/dashboard/reviews/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Review
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually create a review for a specific solution</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/reviews/bulk-upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload multiple student solutions at once via JSON</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/reviews/llm-processing">
                      <Brain className="w-4 h-4 mr-2" />
                      LLM Assessment
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use AI to automatically assess and review solutions</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/reviews/approval-dashboard">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approvals
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Review and approve AI-generated assessments</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>

      {canCreateReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50"
                      asChild
                    >
                      <Link to="/dashboard/reviews/processing-status">
                        <Activity className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-medium">Processing Status</div>
                          <div className="text-xs text-muted-foreground">
                            View active operations
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Monitor real-time status of bulk operations and AI processing tasks</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50 group"
                      asChild
                    >
                      <Link to="/dashboard/reviews/approval-dashboard">
                        <CheckCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                        <div className="text-center">
                          <div className="font-medium">Pending Approvals</div>
                          <div className="text-xs text-muted-foreground">
                            Review AI feedback
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Review, approve, or modify AI-generated assessments before publishing</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50 group"
                      asChild
                    >
                      <Link to="/dashboard/reviews/bulk-upload">
                        <Upload className="w-6 h-6 transition-transform duration-200 group-hover:-translate-y-1" />
                        <div className="text-center">
                          <div className="font-medium">Import Solutions</div>
                          <div className="text-xs text-muted-foreground">
                            Bulk solution upload
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Import multiple student solutions from JSON format for batch processing</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50 group"
                      asChild
                    >
                      <Link to="/dashboard/reviews/llm-processing">
                        <Brain className="w-6 h-6 transition-transform duration-200 group-hover:pulse" />
                        <div className="text-center">
                          <div className="font-medium">AI Assessment</div>
                          <div className="text-xs text-muted-foreground">
                            Configure LLM reviews
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure and start AI-powered automatic assessment of student solutions</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="auto">Auto Reviews</SelectItem>
            <SelectItem value="manual">Manual Reviews</SelectItem>
            <SelectItem value="auto_approved">Auto Approved</SelectItem>
            <SelectItem value="auto_modified">Auto Modified</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="score-high">Highest Score</SelectItem>
            <SelectItem value="score-low">Lowest Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {total === 0
                ? 'There are no reviews yet.'
                : 'No reviews match your current filters.'}
            </p>
            {canCreateReview && total === 0 && (
              <Button asChild>
                <Link to="/dashboard/reviews/create">Create First Review</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Review #{review.id}</CardTitle>
                  {getSourceBadge(review.source)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                  {review.reviewerId && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Reviewer ID: {review.reviewerId}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span
                      className={`font-semibold ${getScoreColor(review.totalScore)}`}
                    >
                      {review.totalScore} points
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {review.criteriaScores.length} criteria
                  </span>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Feedback to Student</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {review.feedbackToStudent}
                  </p>
                </div>

                {review.reviewerComment && (
                  <div>
                    <h4 className="font-medium mb-2">Reviewer Comment</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.reviewerComment}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Task Solution #{review.taskSolutionId}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dashboard/reviews/${review.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8">
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
        </>
      )}
    </div>
  );
};

export default ReviewsPage;
