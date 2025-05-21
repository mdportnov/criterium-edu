import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { type TaskSolution, type TaskSolutionReview, UserRole } from '@/types';
import { TaskSolutionService, TaskSolutionReviewService } from '@/services';

const SolutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [solution, setSolution] = useState<TaskSolution | null>(null);
  const [review, setReview] = useState<TaskSolutionReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isStudent = hasRole(UserRole.STUDENT);
  const isMentor = hasRole(UserRole.MENTOR);
  const isAdmin = hasRole(UserRole.ADMIN);
  const canReview = isMentor || isAdmin;
  const isOwnSolution = solution?.studentId === user?.id;

  useEffect(() => {
    const fetchSolutionData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError('');

      try {
        const solutionId = parseInt(id, 10);
        const solutionData =
          await TaskSolutionService.getTaskSolutionById(solutionId);
        setSolution(solutionData);

        // Check if there's a review for this solution
        try {
          const reviews =
            await TaskSolutionReviewService.getTaskSolutionReviewsBySolutionId(
              solutionId,
            );
          if (reviews.length > 0) {
            setReview(reviews[0]);
          }
        } catch (reviewErr) {
          console.error('Error fetching review:', reviewErr);
          // Don't set an error for review fetch failure
        }
      } catch (err: any) {
        console.error('Error fetching solution:', err);
        setError(
          err.response?.data?.message ||
            'Failed to load solution. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutionData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !solution) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error || 'Solution not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  // Only allow access to the solution owner, mentors, or admins
  if (!isOwnSolution && !canReview) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>You don't have permission to view this solution.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const getTotalScore = () => {
    if (!review) return 0;

    return review.criteriaScores.reduce(
      (total, score) => total + score.points,
      0,
    );
  };

  const getMaxPossibleScore = () => {
    if (!review) return 0;

    return review.criteriaScores.reduce(
      (total, score) => total + score.maxPoints,
      0,
    );
  };

  const getScorePercentage = () => {
    const maxScore = getMaxPossibleScore();
    if (maxScore === 0) return 0;

    return (getTotalScore() / maxScore) * 100;
  };

  const getScoreColor = () => {
    const percentage = getScorePercentage();

    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Link to="/tasks" className="hover:text-primary">
          Tasks
        </Link>
        <span>/</span>
        <Link to={`/tasks/${solution.taskId}`} className="hover:text-primary">
          Task #{solution.taskId}
        </Link>
        <span>/</span>
        <span>Solution #{solution.id}</span>
      </div>

      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Solution #{solution.id}</h1>

        <div className="flex gap-2">
          {canReview && solution.status !== 'reviewed' && (
            <Button asChild>
              <Link to={`/solutions/${solution.id}/review`}>
                {solution.status === 'in_review'
                  ? 'Continue Review'
                  : 'Start Review'}
              </Link>
            </Button>
          )}

          {isStudent && isOwnSolution && (
            <Button asChild variant="outline">
              <Link to={`/tasks/${solution.taskId}/submit-solution`}>
                Submit New Solution
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Solution Code */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Solution Code</h2>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto font-mono text-sm">
              <code>{solution.solution}</code>
            </pre>
          </div>

          {/* Solution Notes */}
          {solution.notes && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <p className="whitespace-pre-line">{solution.notes}</p>
            </div>
          )}

          {/* Review */}
          {review && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Review</h2>

              <div className="space-y-6">
                {/* Criteria Scores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Criteria Evaluation</h3>

                  {review.criteriaScores.map((score, index) => (
                    <div
                      key={index}
                      className="border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{score.criterionName}</h4>
                        <span className="font-medium">
                          {score.points} / {score.maxPoints} points
                        </span>
                      </div>
                      <p className="text-muted-foreground">{score.feedback}</p>
                    </div>
                  ))}
                </div>

                {/* Overall Feedback */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Overall Feedback</h3>
                  <p className="whitespace-pre-line">{review.feedback}</p>
                </div>

                {/* Reviewer */}
                <div className="text-sm text-muted-foreground">
                  Reviewed by {review.reviewerName} on{' '}
                  {new Date(review.reviewedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Solution Metadata */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Solution Details</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                <p className="mt-1 capitalize font-medium">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      solution.status === 'reviewed'
                        ? 'bg-green-100 text-green-800'
                        : solution.status === 'in_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {solution.status.replace('_', ' ')}
                  </span>
                </p>
              </div>

              {review && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Score
                  </h3>
                  <p className={`mt-1 font-bold text-lg ${getScoreColor()}`}>
                    {getTotalScore()} / {getMaxPossibleScore()} (
                    {getScorePercentage().toFixed(1)}%)
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Submitted By
                </h3>
                <p className="mt-1">{solution.studentName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Submitted On
                </h3>
                <p className="mt-1">
                  {new Date(solution.submittedAt).toLocaleString()}
                </p>
              </div>

              {solution.updatedAt !== solution.submittedAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </h3>
                  <p className="mt-1">
                    {new Date(solution.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/tasks/${solution.taskId}`}>View Task</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionDetailPage;
