import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Alert } from '@/components/common';
import { taskSolutionsService, taskSolutionReviewsService } from '@/api';
import { useAuth } from '@/context/AuthContext.tsx';
import { UserRole, TaskSolutionStatus } from '@/types';
import { useToast } from '@/hooks';

const SolutionDetailPage = () => {
  const { solutionId } = useParams();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get solution details
  const {
    data: solution,
    isLoading: solutionLoading,
    error: solutionError,
  } = useQuery({
    queryKey: ['solution', solutionId],
    queryFn: () => taskSolutionsService.getById(Number(solutionId)),
    enabled: !!solutionId,
  });

  // Get task details
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', solution?.taskId],
    queryFn: () =>
      solution
        ? taskSolutionsService.getById(solution.taskId)
        : Promise.resolve(null),
    enabled: !!solution,
  });

  // Get review if it exists
  const { data: review, isLoading: reviewLoading } = useQuery({
    queryKey: ['review', solutionId],
    queryFn: () =>
      taskSolutionReviewsService.getByTaskSolutionId(Number(solutionId)),
    enabled: !!solutionId,
    retry: false,
  });

  // Mutation for updating solution status (for mentors/admins)
  const updateStatusMutation = useMutation({
    mutationFn: (status: TaskSolutionStatus) =>
      taskSolutionsService.update(Number(solutionId), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solution', solutionId] });
      showToast('Status updated successfully!', 'success');
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      showToast('Failed to update status.', 'error');
    },
  });

  const handleStartReview = () => {
    updateStatusMutation.mutate(TaskSolutionStatus.IN_REVIEW);
  };

  const isLoading = solutionLoading || taskLoading || reviewLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (solutionError || !solution) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Error">
          Failed to load solution details. Please try again.
        </Alert>
        <div className="mt-4">
          <Link to="/solutions" className="btn btn-primary">
            Back to Solutions
          </Link>
        </div>
      </div>
    );
  }

  // Check if the user has permission to view this solution
  const canViewSolution =
    hasRole([UserRole.ADMIN, UserRole.MENTOR]) ||
    (user && user.id === solution.studentId);

  if (!canViewSolution) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Access Denied">
          You don't have permission to view this solution.
        </Alert>
        <div className="mt-4">
          <Link to="/solutions" className="btn btn-primary">
            Back to Solutions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="page-header mb-0">
          Solution for: {task?.title || `Task #${solution.taskId}`}
        </h1>
        <div className="flex gap-2">
          <Link to="/solutions" className="btn btn-ghost">
            Back to Solutions
          </Link>

          {hasRole([UserRole.ADMIN, UserRole.MENTOR]) &&
            solution.status === TaskSolutionStatus.SUBMITTED && (
              <Button
                variant="primary"
                onClick={handleStartReview}
                isLoading={updateStatusMutation.isPending}
              >
                Start Review
              </Button>
            )}

          {hasRole([UserRole.ADMIN, UserRole.MENTOR]) &&
            solution.status === TaskSolutionStatus.IN_REVIEW &&
            !review && (
              <Link
                to={`/reviews/create?solutionId=${solution.id}`}
                className="btn btn-primary"
              >
                Create Review
              </Link>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Solution">
            <div className="mb-4">
              <div className="badge badge-lg mr-2">
                Status: {solution.status}
              </div>
              <div className="badge badge-outline badge-lg">
                Submitted: {new Date(solution.submittedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="mockup-code p-4 whitespace-pre-wrap text-left">
              {solution.solutionText}
            </div>
          </Card>

          {/* Review section if it exists */}
          {review && (
            <Card title="Review Feedback" className="mt-6">
              <div className="mb-4">
                <div className="badge badge-lg badge-primary mr-2">
                  Score: {review.totalScore}
                </div>
                <div className="badge badge-outline badge-lg">
                  Source: {review.source}
                </div>
              </div>

              <div className="whitespace-pre-wrap">
                {review.feedbackToStudent}
              </div>

              {hasRole([UserRole.ADMIN, UserRole.MENTOR]) &&
                review.mentorComment && (
                  <div className="mt-4 p-4 bg-base-200 rounded-box">
                    <h3 className="font-semibold mb-2">
                      Mentor Comments (only visible to mentors):
                    </h3>
                    <div className="whitespace-pre-wrap">
                      {review.mentorComment}
                    </div>
                  </div>
                )}

              <div className="divider">Criteria Scores</div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>Score</th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.criteriaScores.map((score) => {
                      const criterion = task?.criteria.find(
                        (c) => c.id === score.criterionId,
                      );
                      return (
                        <tr key={score.criterionId}>
                          <td>
                            {criterion?.name ||
                              `Criterion #${score.criterionId}`}
                          </td>
                          <td>
                            {score.score} / {criterion?.maxPoints || '?'}
                          </td>
                          <td>{score.comment || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/reviews/${review.id}/edit`}
                    className="btn btn-secondary"
                  >
                    Edit Review
                  </Link>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          {/* Task details sidebar */}
          <Card title="Task Details">
            <h3 className="font-semibold mb-2">Description:</h3>
            <p className="mb-4">
              {task?.description || 'Loading task details...'}
            </p>

            <h3 className="font-semibold mb-2">Evaluation Criteria:</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              {task?.criteria.map((criterion) => (
                <li key={criterion.id}>
                  <span className="font-medium">{criterion.name}</span>
                  {' - '}
                  {criterion.description}
                  {' ('}
                  <span className="font-semibold">
                    {criterion.maxPoints} points
                  </span>
                  )
                </li>
              ))}
            </ul>

            <Link
              to={`/tasks/${solution.taskId}`}
              className="btn btn-outline btn-sm w-full"
            >
              View Full Task
            </Link>
          </Card>

          {/* Student info for mentors/admins */}
          {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
            <Card title="Student Information" className="mt-6">
              <div className="flex items-center mb-4">
                <div className="avatar placeholder mr-4">
                  <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
                    <span>
                      {solution.student?.firstName?.[0]}
                      {solution.student?.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">
                    {solution.student?.firstName} {solution.student?.lastName}
                  </h3>
                  <p className="text-sm opacity-70">
                    {solution.student?.email}
                  </p>
                </div>
              </div>

              <Link
                to={`/users/${solution.studentId}`}
                className="btn btn-outline btn-sm w-full"
              >
                View Student Profile
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionDetailPage;
