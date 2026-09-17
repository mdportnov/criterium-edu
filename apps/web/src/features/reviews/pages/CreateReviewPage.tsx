import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { TaskSolutionReviewService, TaskSolutionService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CreateTaskSolutionReviewRequest,
  CriterionScore,
  Task,
  TaskSolution,
} from '@/types';
import { ReviewSource } from '@/types';
import { Save } from 'lucide-react';

const CreateReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [taskSolution, setTaskSolution] = useState<TaskSolution | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    taskSolutionId: '',
    feedbackToStudent: '',
    reviewerComment: '',
    criteriaScores: [] as CriterionScore[],
  });

  useEffect(() => {
    const taskSolutionId = searchParams.get('taskSolutionId');
    if (taskSolutionId) {
      setFormData((prev) => ({
        ...prev,
        taskSolutionId: taskSolutionId,
      }));
      fetchTaskSolution(taskSolutionId);
    }
  }, [searchParams]);

  const fetchTaskSolution = async (id: string) => {
    try {
      setLoading(true);
      const solutionData = await TaskSolutionService.getTaskSolutionById(id);
      setTaskSolution(solutionData);

      if (solutionData.task) {
        // NOTE: `task` state is never set, so every `taskSolution && task` branch below
        // is dead — the criteria scoring form and the submit button cannot render. It
        // cannot be fixed here: `TaskSolution['task'].criteria` declares `{id, title}`
        // while this screen reads `name` and `maxPoints`. Needs a types/API change.
        const initialScores =
          solutionData.task.criteria?.map((criterion) => ({
            criterionId: criterion.id,
            score: 0,
            comment: '',
          })) || [];
        setFormData((prev) => ({ ...prev, criteriaScores: initialScores }));
      }
    } catch {
      setError('Failed to load the task solution.');
    } finally {
      setLoading(false);
    }
  };

  const updateCriterionScore = (
    criterionId: string,
    field: 'score' | 'comment',
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      criteriaScores: prev.criteriaScores.map((score) =>
        score.criterionId === criterionId
          ? { ...score, [field]: field === 'score' ? Number(value) : value }
          : score,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!taskSolution || !task) {
      setError('Task solution not loaded.');
      return;
    }

    if (!formData.feedbackToStudent.trim()) {
      setError('Feedback to student is required.');
      return;
    }

    if (formData.criteriaScores.some((score) => score.score < 0)) {
      setError('Scores cannot be negative.');
      return;
    }

    try {
      setLoading(true);

      const reviewData: CreateTaskSolutionReviewRequest = {
        taskSolutionId: formData.taskSolutionId,
        criteriaScores: formData.criteriaScores,
        feedbackToStudent: formData.feedbackToStudent,
        reviewerComment: formData.reviewerComment || undefined,
        source: ReviewSource.MANUAL,
      };

      const review = await TaskSolutionReviewService.createReview(reviewData);
      setSuccess('Review created.');

      setTimeout(() => {
        navigate(`/dashboard/reviews/${review.id}`);
      }, 1500);
    } catch {
      setError('Failed to create the review.');
    } finally {
      setLoading(false);
    }
  };

  const totalScore = formData.criteriaScores.reduce(
    (sum, score) => sum + score.score,
    0,
  );
  const maxScore =
    task?.criteria?.reduce((sum, criterion) => sum + criterion.maxPoints, 0) ||
    0;

  if (!user || (user.role !== 'admin' && user.role !== 'reviewer')) {
    return (
      <div>
        <PageHeader title="Create review" backTo="/dashboard/reviews" />
        <Alert variant="destructive">
          <AlertDescription>
            You don&apos;t have permission to create reviews.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create review"
        description="Score a task solution against its criteria and leave feedback."
        backTo="/dashboard/reviews"
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!formData.taskSolutionId && (
              <Card>
                <CardHeader>
                  <CardHeaderText>
                    <CardTitle>Select task solution</CardTitle>
                  </CardHeaderText>
                </CardHeader>
                <CardContent>
                  <Field
                    label="Task solution ID"
                    htmlFor="taskSolutionId"
                    required
                  >
                    <Input
                      id="taskSolutionId"
                      type="number"
                      placeholder="Enter task solution ID"
                      value={formData.taskSolutionId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          taskSolutionId: id,
                        }));
                        if (id) {
                          fetchTaskSolution(id);
                        }
                      }}
                      required
                    />
                  </Field>
                </CardContent>
              </Card>
            )}

            {taskSolution && task && (
              <>
                <Card>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>Task solution details</CardTitle>
                    </CardHeaderText>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <span className="text-muted-foreground">Solution</span>
                        <span className="ml-2 font-medium text-foreground">
                          #{taskSolution.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Task</span>
                        <span className="ml-2 font-medium text-foreground">
                          {task.title}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Student</span>
                        <span className="ml-2 font-medium text-foreground">
                          User #{taskSolution.studentId}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Status</span>
                        <span className="ml-2">
                          <StatusBadge status={taskSolution.status} />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>Criteria scores</CardTitle>
                    </CardHeaderText>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.criteriaScores.map((criterionScore) => {
                      const criterion = task.criteria?.find(
                        (c) => c.id === criterionScore.criterionId,
                      );
                      return (
                        <div
                          key={criterionScore.criterionId}
                          className="space-y-3 rounded-md border border-border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-[13px] font-medium text-foreground">
                              {criterion?.name ||
                                `Criterion #${criterionScore.criterionId}`}
                            </h4>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              Max: {criterion?.maxPoints || 0}
                            </span>
                          </div>

                          {criterion?.description && (
                            <p className="text-xs leading-5 text-muted-foreground">
                              {criterion.description}
                            </p>
                          )}

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field
                              label="Score"
                              htmlFor={`score-${criterionScore.criterionId}`}
                            >
                              <Input
                                id={`score-${criterionScore.criterionId}`}
                                type="number"
                                min="0"
                                max={criterion?.maxPoints || 100}
                                value={criterionScore.score}
                                onChange={(e) =>
                                  updateCriterionScore(
                                    criterionScore.criterionId,
                                    'score',
                                    e.target.value,
                                  )
                                }
                                required
                              />
                            </Field>
                            <Field
                              label="Comment (optional)"
                              htmlFor={`comment-${criterionScore.criterionId}`}
                            >
                              <Input
                                id={`comment-${criterionScore.criterionId}`}
                                placeholder="Add comment for this criterion"
                                value={criterionScore.comment || ''}
                                onChange={(e) =>
                                  updateCriterionScore(
                                    criterionScore.criterionId,
                                    'comment',
                                    e.target.value,
                                  )
                                }
                              />
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>Feedback</CardTitle>
                    </CardHeaderText>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Field
                      label="Feedback to student"
                      htmlFor="feedbackToStudent"
                      required
                    >
                      <Textarea
                        id="feedbackToStudent"
                        placeholder="Provide detailed feedback for the student…"
                        value={formData.feedbackToStudent}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            feedbackToStudent: e.target.value,
                          }))
                        }
                        className="min-h-32"
                        required
                      />
                    </Field>

                    <Field
                      label="Reviewer comment (optional)"
                      htmlFor="reviewerComment"
                    >
                      <Textarea
                        id="reviewerComment"
                        placeholder="Add internal notes or comments…"
                        value={formData.reviewerComment}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            reviewerComment: e.target.value,
                          }))
                        }
                        className="min-h-24"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-4">
            {taskSolution && task && (
              <Card>
                <CardHeader>
                  <CardHeaderText>
                    <CardTitle>Review summary</CardTitle>
                  </CardHeaderText>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-semibold leading-8 tracking-tight tabular-nums text-foreground">
                      {totalScore}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / {maxScore}
                      </span>
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {maxScore > 0
                        ? Math.round((totalScore / maxScore) * 100)
                        : 0}
                      %
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Criteria breakdown
                    </p>
                    {formData.criteriaScores.map((score) => {
                      const criterion = task.criteria?.find(
                        (c) => c.id === score.criterionId,
                      );
                      return (
                        <div
                          key={score.criterionId}
                          className="flex justify-between gap-2 text-[13px]"
                        >
                          <span className="truncate text-foreground">
                            {criterion?.name ||
                              `Criterion #${score.criterionId}`}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {score.score}/{criterion?.maxPoints || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !taskSolution || !task}
                >
                  <Save className="size-4" />
                  {loading ? 'Creating…' : 'Create review'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateReviewPage;
