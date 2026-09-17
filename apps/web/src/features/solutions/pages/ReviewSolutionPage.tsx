import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Separator } from '@/components/ui/separator';
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
import { UserRole } from '@app/shared/interfaces';
import { getErrorMessage } from '@/lib/errors';

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

  const fetchData = async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      // Fetch solution
      const solutionData = await TaskSolutionService.getTaskSolutionById(id);
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
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(getErrorMessage(err, 'Failed to load data. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
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
        setError(`Score cannot be negative`);
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

      void navigate(`/dashboard/solutions/${id}`);
    } catch (err) {
      console.error('Error saving review:', err);
      setError(
        getErrorMessage(err, 'Failed to save review. Please try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!canReview) {
    return (
      <div>
        <PageHeader title="Review solution" backTo="/tasks" />
        <ErrorState
          title="Access denied"
          message="You don't have permission to review solutions."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Review solution" backTo="/tasks" />
        <LoadingState label="Loading solution…" />
      </div>
    );
  }

  if (error && !solution) {
    return (
      <div>
        <PageHeader title="Review solution" backTo="/tasks" />
        <ErrorState
          title="Could not load solution"
          message={error}
          onRetry={() => void fetchData()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={existingReview ? 'Edit review' : 'Review solution'}
        description={`Solution #${id} — Task #${solution?.taskId}`}
        backTo={`/dashboard/solutions/${id}`}
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Solution</CardTitle>
                <CardDescription>What the student submitted.</CardDescription>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              {solution?.solutionText ? (
                <pre className="code-block">{solution.solutionText}</pre>
              ) : (
                <EmptyState
                  title="No submission text"
                  description="This solution has no text to show."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Criteria</CardTitle>
                <CardDescription>
                  Score each criterion and leave feedback for the student.
                </CardDescription>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.criteriaScores.length === 0 ? (
                <EmptyState
                  title="No criteria defined"
                  description="This task has no scoring criteria to review."
                />
              ) : (
                formData.criteriaScores.map((score, index) => {
                  const criterion = taskCriteria[index];
                  return (
                    <div
                      key={score.criterionId || index}
                      className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Label
                            htmlFor={`points-${index}`}
                            className="text-foreground"
                          >
                            {criterion?.name || 'Criterion'}
                          </Label>
                          {criterion?.description && (
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                              {criterion.description}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Input
                            id={`points-${index}`}
                            type="number"
                            min={0}
                            max={criterion?.maxPoints || 0}
                            value={score.score}
                            onChange={(e) =>
                              handleCriterionScoreChange(
                                index,
                                Number(e.target.value),
                              )
                            }
                            className="h-7 w-16 text-right tabular-nums"
                          />
                          <span className="text-xs tabular-nums text-muted-foreground">
                            / {criterion?.maxPoints || 0}
                          </span>
                        </div>
                      </div>

                      <Textarea
                        id={`feedback-${index}`}
                        value={score.comment || ''}
                        onChange={(e) =>
                          handleCriterionCommentChange(index, e.target.value)
                        }
                        placeholder="Feedback for this criterion…"
                        className="min-h-16"
                        required
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Overall feedback</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <Textarea
                id="feedback"
                value={formData.feedbackToStudent}
                onChange={handleFeedbackChange}
                placeholder="Provide overall feedback for this solution…"
                className="min-h-28"
                required
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => void navigate(`/dashboard/solutions/${id}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Saving…'
                  : existingReview
                    ? 'Update review'
                    : 'Submit review'}
              </Button>
            </CardFooter>
          </Card>
        </form>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardHeaderText>
                <CardTitle>Details</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Status</span>
                {solution?.status ? (
                  <StatusBadge status={solution.status} />
                ) : (
                  <span className="text-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Student</span>
                <span className="font-medium text-foreground">
                  #{solution?.studentId}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Submitted</span>
                <span className="text-foreground">
                  {solution?.submittedAt
                    ? new Date(solution.submittedAt).toLocaleString()
                    : '—'}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Current score
                </span>
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {getTotalScore()} / {getMaxPossibleScore()}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({getScorePercentage().toFixed(1)}%)
                  </span>
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/dashboard/solutions/${id}`}>
                  View full solution
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/dashboard/tasks/${solution?.taskId}`}>
                  View task
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewSolutionPage;
