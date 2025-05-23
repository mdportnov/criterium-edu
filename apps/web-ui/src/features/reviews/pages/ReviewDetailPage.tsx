import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaskSolutionReviewService, TaskSolutionService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskSolutionReview, TaskSolution, ReviewSource } from '@/types';
import {
  ArrowLeft,
  Calendar,
  User,
  Star,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

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
      fetchReview(Number(id));
    }
  }, [id]);

  const fetchReview = async (reviewId: number) => {
    try {
      setLoading(true);
      const reviewData = await TaskSolutionReviewService.getReviewById(reviewId);
      setReview(reviewData);

      const solutionData = await TaskSolutionService.getTaskSolutionById(reviewData.taskSolutionId);
      setTaskSolution(solutionData);
    } catch (err) {
      setError('Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async () => {
    if (!review || review.source !== 'auto') return;

    try {
      setActionLoading(true);
      const updatedReview = await TaskSolutionReviewService.approveAutoReview(review.id);
      setReview(updatedReview);
    } catch (err) {
      setError('Failed to approve review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!review || !window.confirm('Are you sure you want to delete this review?')) return;

    try {
      setActionLoading(true);
      await TaskSolutionReviewService.deleteReview(review.id);
      navigate('/dashboard/reviews');
    } catch (err) {
      setError('Failed to delete review');
      setActionLoading(false);
    }
  };

  const getSourceBadge = (source: ReviewSource) => {
    const variants = {
      auto: 'bg-blue-100 text-blue-800 border-blue-200',
      manual: 'bg-green-100 text-green-800 border-green-200',
      auto_approved: 'bg-purple-100 text-purple-800 border-purple-200',
      auto_modified: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const labels = {
      auto: 'Auto Review',
      manual: 'Manual Review',
      auto_approved: 'Auto Approved',
      auto_modified: 'Auto Modified',
    };

    const icons = {
      auto: <Clock className="h-3 w-3" />,
      manual: <User className="h-3 w-3" />,
      auto_approved: <CheckCircle className="h-3 w-3" />,
      auto_modified: <Edit className="h-3 w-3" />,
    };

    return (
      <Badge className={`${variants[source]} flex items-center gap-1`}>
        {icons[source]}
        {labels[source]}
      </Badge>
    );
  };

  const getScoreColor = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canEditReview = user && (
    user.role === 'ADMIN' || 
    (user.role === 'REVIEWER' && review?.reviewerId === user.id)
  );

  const canDeleteReview = user?.role === 'ADMIN';
  const canApproveReview = review?.source === 'auto' && (user?.role === 'ADMIN' || user?.role === 'REVIEWER');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Review not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/reviews">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reviews
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Review #{review.id}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated: {new Date(review.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {getSourceBadge(review.source)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className={`text-2xl font-bold ${getScoreColor(review.totalScore)}`}>
                    {review.totalScore}
                  </span>
                  <span className="text-muted-foreground">total points</span>
                </div>
                {review.reviewerId && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Reviewer ID: {review.reviewerId}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Feedback to Student</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{review.feedbackToStudent}</p>
                </div>
              </div>

              {review.reviewerComment && (
                <div>
                  <h3 className="font-semibold mb-3">Reviewer Comment</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{review.reviewerComment}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Criteria Scores</h3>
                <div className="space-y-3">
                  {review.criteriaScores.map((criterionScore, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Criterion #{criterionScore.criterionId}</span>
                        <span className={`font-bold ${getScoreColor(criterionScore.score)}`}>
                          {criterionScore.score} points
                        </span>
                      </div>
                      {criterionScore.comment && (
                        <p className="text-sm text-muted-foreground mt-2">
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

        <div className="space-y-6">
          {taskSolution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Solution ID:</span>
                    <span className="text-sm font-medium">#{taskSolution.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Task:</span>
                    <span className="text-sm font-medium">{taskSolution.task?.title || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{taskSolution.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <span className="text-sm">{new Date(taskSolution.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/dashboard/solutions/${taskSolution.id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Solution
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canApproveReview && (
                <Button 
                  onClick={handleApproveReview} 
                  disabled={actionLoading}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Auto Review
                </Button>
              )}
              
              {canEditReview && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/dashboard/reviews/${review.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Review
                  </Link>
                </Button>
              )}
              
              {canDeleteReview && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteReview}
                  disabled={actionLoading}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Review
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;