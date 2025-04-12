import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Alert } from '@/components/common';
import { taskSolutionReviewsService, taskSolutionsService, tasksService } from '@/api';

const ReviewDetailPage = () => {
  const { reviewId } = useParams();
  
  // Get review details
  const { 
    data: review, 
    isLoading: reviewLoading, 
    error: reviewError 
  } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => taskSolutionReviewsService.getById(Number(reviewId)),
    enabled: !!reviewId,
  });
  
  // Get solution details
  const { 
    data: solution, 
    isLoading: solutionLoading 
  } = useQuery({
    queryKey: ['solution', review?.taskSolutionId],
    queryFn: () => review ? taskSolutionsService.getById(review.taskSolutionId) : Promise.resolve(null),
    enabled: !!review,
  });
  
  // Get task details
  const { 
    data: task, 
    isLoading: taskLoading 
  } = useQuery({
    queryKey: ['task', solution?.taskId],
    queryFn: () => solution ? tasksService.getById(solution.taskId) : Promise.resolve(null),
    enabled: !!solution,
  });
  
  const isLoading = reviewLoading || solutionLoading || taskLoading;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (reviewError || !review) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Error">
          Failed to load review details. Please try again.
        </Alert>
        <div className="mt-4">
          <Link to="/reviews" className="btn btn-primary">
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="page-header mb-0">
          Review for: {task?.title || `Task #${solution?.taskId || 'Unknown'}`}
        </h1>
        <div className="flex gap-2">
          <Link to="/reviews" className="btn btn-ghost">
            Back to Reviews
          </Link>
          
          <Link 
            to={`/reviews/${reviewId}/edit`}
            className="btn btn-secondary"
          >
            Edit Review
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Review Feedback">
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
            
            {review.mentorComment && (
              <div className="mt-4 p-4 bg-base-200 rounded-box">
                <h3 className="font-semibold mb-2">Mentor Comments:</h3>
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
                    const criterion = task?.criteria.find(c => c.id === score.criterionId);
                    return (
                      <tr key={score.criterionId}>
                        <td>{criterion?.name || `Criterion #${score.criterionId}`}</td>
                        <td>
                          {score.score} / {criterion?.maxPoints || '?'}
                        </td>
                        <td>{score.comment || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={1}>Total</th>
                    <th colSpan={2}>{review.totalScore}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          
          {solution && (
            <Card title="Student Solution" className="mt-6">
              <div className="mb-4">
                <div className="badge badge-lg mr-2">Status: {solution.status}</div>
                <div className="badge badge-outline badge-lg">
                  Submitted: {new Date(solution.submittedAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="mockup-code p-4 whitespace-pre-wrap text-left">
                {solution.solutionText}
              </div>
              
              <div className="mt-4">
                <Link 
                  to={`/solutions/${solution.id}`}
                  className="btn btn-outline"
                >
                  View Full Solution
                </Link>
              </div>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-1">
          {/* Task details sidebar */}
          <Card title="Task Details">
            <h3 className="font-semibold mb-2">Description:</h3>
            <p className="mb-4">{task?.description || 'Loading task details...'}</p>
            
            <h3 className="font-semibold mb-2">Evaluation Criteria:</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              {task?.criteria.map((criterion) => (
                <li key={criterion.id}>
                  <span className="font-medium">{criterion.name}</span>
                  {' - '}{criterion.description}
                  {' ('}<span className="font-semibold">{criterion.maxPoints} points</span>)
                </li>
              ))}
            </ul>
            
            {task && (
              <Link 
                to={`/tasks/${task.id}`}
                className="btn btn-outline btn-sm w-full"
              >
                View Full Task
              </Link>
            )}
          </Card>
          
          {/* Review metadata */}
          <Card title="Review Information" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Created:</h3>
                <p>{new Date(review.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Last Updated:</h3>
                <p>{new Date(review.updatedAt).toLocaleString()}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Mentor:</h3>
                <p>{review.mentorId ? `Mentor #${review.mentorId}` : 'Automated system'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Review Source:</h3>
                <div className="badge">{review.source}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
