import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskSolutionReviewService, TaskSolutionService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CreateTaskSolutionReviewRequest,
  CriterionScore,
  Task,
  TaskSolution,
} from '@/types';
import { ReviewSource } from '@/types';
import { AlertCircle, ArrowLeft, CheckCircle, Save } from 'lucide-react';

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
        const initialScores =
          solutionData.task.criteria?.map((criterion) => ({
            criterionId: criterion.id,
            score: 0,
            comment: '',
          })) || [];
        setFormData((prev) => ({ ...prev, criteriaScores: initialScores }));
      }
    } catch (err) {
      setError('Failed to load task solution');
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
      setError('Task solution not loaded');
      return;
    }

    if (!formData.feedbackToStudent.trim()) {
      setError('Feedback to student is required');
      return;
    }

    if (formData.criteriaScores.some((score) => score.score < 0)) {
      setError('Scores cannot be negative');
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
      setSuccess('Review created successfully!');

      setTimeout(() => {
        navigate(`/dashboard/reviews/${review.id}`);
      }, 1500);
    } catch (err) {
      setError('Failed to create review');
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
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create reviews
          </AlertDescription>
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

      <div>
        <h1 className="text-3xl font-bold">Create Review</h1>
        <p className="text-muted-foreground">
          Create a new review for a task solution
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!formData.taskSolutionId && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Task Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="taskSolutionId">Task Solution ID</Label>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {taskSolution && task && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Task Solution Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Solution ID:
                        </span>
                        <span className="ml-2 font-medium">
                          #{taskSolution.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Task:</span>
                        <span className="ml-2 font-medium">{task.title}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Student:</span>
                        <span className="ml-2 font-medium">
                          User #{taskSolution.studentId}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className="ml-2 font-medium">
                          {taskSolution.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Criteria Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.criteriaScores.map((criterionScore) => {
                      const criterion = task.criteria?.find(
                        (c) => c.id === criterionScore.criterionId,
                      );
                      return (
                        <div
                          key={criterionScore.criterionId}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {criterion?.name ||
                                `Criterion #${criterionScore.criterionId}`}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              Max: {criterion?.maxPoints || 0}
                            </span>
                          </div>

                          {criterion?.description && (
                            <p className="text-sm text-muted-foreground">
                              {criterion.description}
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`score-${criterionScore.criterionId}`}
                              >
                                Score
                              </Label>
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
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`comment-${criterionScore.criterionId}`}
                              >
                                Comment (Optional)
                              </Label>
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
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="feedbackToStudent">
                        Feedback to Student *
                      </Label>
                      <Textarea
                        id="feedbackToStudent"
                        placeholder="Provide detailed feedback for the student..."
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reviewerComment">
                        Reviewer Comment (Optional)
                      </Label>
                      <Textarea
                        id="reviewerComment"
                        placeholder="Add internal notes or comments..."
                        value={formData.reviewerComment}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            reviewerComment: e.target.value,
                          }))
                        }
                        className="min-h-24"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6">
            {taskSolution && task && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {totalScore}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      out of {maxScore} points
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {maxScore > 0
                        ? Math.round((totalScore / maxScore) * 100)
                        : 0}
                      %
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Criteria Breakdown:
                    </div>
                    {formData.criteriaScores.map((score) => {
                      const criterion = task.criteria?.find(
                        (c) => c.id === score.criterionId,
                      );
                      return (
                        <div
                          key={score.criterionId}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate">
                            {criterion?.name ||
                              `Criterion #${score.criterionId}`}
                          </span>
                          <span>
                            {score.score}/{criterion?.maxPoints || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="sticky top-6">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !taskSolution || !task}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Review...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Review
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateReviewPage;
