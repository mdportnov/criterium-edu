import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type CreateTaskSolutionReviewRequest,
  ReviewSource,
  type TaskCriterion,
  type TaskSolution,
  type TaskSolutionReview,
} from '@/types';
import {
  TaskService,
  TaskSolutionReviewService,
  TaskSolutionService,
} from '@/services';
import { UserRole } from '@app/shared';

const ReviewSolutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [solution, setSolution] = useState<TaskSolution | null>(null);
  const [taskCriteria, setTaskCriteria] = useState<TaskCriterion[]>([]);
  const [existingReview, setExistingReview] =
    useState<TaskSolutionReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const canReview = hasRole([UserRole.REVIEWER, UserRole.ADMIN]);

  const [formData, setFormData] = useState<CreateTaskSolutionReviewRequest>({
    taskSolutionId: '',
    feedbackToStudent: '',
    criteriaScores: [],
    source: ReviewSource.MANUAL,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError('');

      try {
        // Fetch solution
        const solutionData =
          await TaskSolutionService.getTaskSolutionById(id);
        setSolution(solutionData);

        // Fetch task to get criteria
        const taskData = await TaskService.getTaskById(solutionData.taskId);
        setTaskCriteria(taskData.criteria);

        // Check if there's an existing review
        try {
          const reviews =
            await TaskSolutionReviewService.getTaskSolutionReviewsBySolutionId(
              id,
            );
          const reviewsArray = Array.isArray(reviews) ? reviews : reviews.data;
          if (reviewsArray.length > 0) {
            setExistingReview(reviewsArray[0]);

            // Initialize form with existing review data
            setFormData({
              taskSolutionId: id,
              feedbackToStudent: reviewsArray[0].feedbackToStudent,
              criteriaScores: reviewsArray[0].criteriaScores.map((score) => ({
                criterionId: score.criterionId,
                score: score.score,
                comment: score.comment,
              })),
              source: ReviewSource.MANUAL,
            });
          } else {
            // Initialize form with empty data based on task criteria
            setFormData({
              taskSolutionId: id,
              feedbackToStudent: '',
              criteriaScores: taskData.criteria.map((criterion) => ({
                criterionId: criterion.id || '',
                score: 0,
                comment: '',
              })),
              source: ReviewSource.MANUAL,
            });
          }
        } catch (reviewErr) {
          console.error('Error fetching review:', reviewErr);

          // Initialize form with empty data based on task criteria
          setFormData({
            taskSolutionId: id,
            feedbackToStudent: '',
            criteriaScores: taskData.criteria.map((criterion) => ({
              criterionId: criterion.id || '',
              score: 0,
              comment: '',
            })),
            source: ReviewSource.MANUAL,
          });
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(
          err.response?.data?.message ||
            'Failed to load data. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, feedbackToStudent: e.target.value }));
  };

  const handleCriterionScoreChange = (index: number, score: number) => {
    const criteriaScores = [...formData.criteriaScores];
    criteriaScores[index] = { ...criteriaScores[index], score };
    setFormData((prev) => ({ ...prev, criteriaScores }));
  };

  const handleCriterionCommentChange = (index: number, comment: string) => {
    const criteriaScores = [...formData.criteriaScores];
    criteriaScores[index] = { ...criteriaScores[index], comment };
    setFormData((prev) => ({ ...prev, criteriaScores }));
  };

  const validateForm = (): boolean => {
    // Check if any criterion score is invalid
    for (const score of formData.criteriaScores) {
      if (score.score < 0) {
        setError(
          `Score cannot be negative`,
        );
        return false;
      }

      if (!score.comment || !score.comment.trim()) {
        setError(`Comment for criterion is required`);
        return false;
      }
    }

    // Check if overall feedback is provided
    if (!formData.feedbackToStudent.trim()) {
      setError('Overall feedback is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (existingReview) {
        // Update existing review
        await TaskSolutionReviewService.updateTaskSolutionReview(
          existingReview.id,
          {
            feedbackToStudent: formData.feedbackToStudent,
            criteriaScores: formData.criteriaScores,
          },
        );
      } else {
        // Create new review
        await TaskSolutionReviewService.createTaskSolutionReview(formData);
      }

      navigate(`/dashboard/solutions/${id}`);
    } catch (err: any) {
      console.error('Error saving review:', err);
      setError(
        err.response?.data?.message ||
          'Failed to save review. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !solution) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>You don't have permission to review solutions.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const getTotalScore = () => {
    return formData.criteriaScores.reduce(
      (total, score) => total + score.score,
      0,
    );
  };

  const getMaxPossibleScore = () => {
    return taskCriteria.reduce(
      (total, criterion) => total + criterion.maxPoints,
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
        <Link to={`/dashboard/tasks/${solution?.taskId}`} className="hover:text-primary">
          Task #{solution?.taskId}
        </Link>
        <span>/</span>
        <Link to={`/dashboard/solutions/${id}`} className="hover:text-primary">
          Solution #{id}
        </Link>
        <span>/</span>
        <span>Review</span>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        {existingReview ? 'Edit Review' : 'Review Solution'}
      </h1>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Criteria Evaluation */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">
                Criteria Evaluation
              </h2>

              <div className="space-y-6">
                {formData.criteriaScores.map((score, index) => (
                  <div
                    key={index}
                    className="border-b border-border pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{taskCriteria[index]?.name || 'Criterion'}</h3>
                      <span className="text-sm text-muted-foreground">
                        Max: {taskCriteria[index]?.maxPoints || 0} points
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`points-${index}`}>Points</Label>
                          <span className="text-sm font-medium">
                            {score.score} / {taskCriteria[index]?.maxPoints || 0}
                          </span>
                        </div>
                        <Input
                          id={`points-${index}`}
                          type="range"
                          min="0"
                          max={taskCriteria[index]?.maxPoints || 0}
                          value={score.score}
                          onChange={(e) =>
                            handleCriterionScoreChange(
                              index,
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`feedback-${index}`}>Feedback</Label>
                        <textarea
                          id={`feedback-${index}`}
                          value={score.comment || ''}
                          onChange={(e) =>
                            handleCriterionCommentChange(index, e.target.value)
                          }
                          placeholder={`Provide feedback for this criterion...`}
                          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Feedback */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Overall Feedback</h2>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <textarea
                  id="feedback"
                  value={formData.feedbackToStudent}
                  onChange={handleFeedbackChange}
                  placeholder="Provide overall feedback for this solution..."
                  className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/solutions/${id}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Saving...'
                  : existingReview
                    ? 'Update Review'
                    : 'Submit Review'}
              </Button>
            </div>
          </form>
        </div>

        <div>
          {/* Solution Preview */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Solution Preview</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Student
                </h3>
                <p className="mt-1">Student #{solution?.studentId}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Submitted
                </h3>
                <p className="mt-1">
                  {solution?.submittedAt &&
                    new Date(solution.submittedAt).toLocaleString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Current Score
                </h3>
                <p className={`mt-1 font-bold text-lg ${getScoreColor()}`}>
                  {getTotalScore()} / {getMaxPossibleScore()} (
                  {getScorePercentage().toFixed(1)}%)
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/dashboard/solutions/${id}`}>View Full Solution</Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link to={`/dashboard/tasks/${solution?.taskId}`}>View Task</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSolutionPage;
