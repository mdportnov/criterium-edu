import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  type Task,
  type TaskSolution,
  type TaskSolutionReview,
  UserRole,
} from '@/types';
import {
  TaskService,
  TaskSolutionReviewService,
  TaskSolutionService,
} from '@/services';

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [solutions, setSolutions] = useState<TaskSolution[]>([]);
  const [reviews, setReviews] = useState<TaskSolutionReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isStudent = hasRole(UserRole.STUDENT);
  const isMentor = hasRole(UserRole.MENTOR);
  const isAdmin = hasRole(UserRole.ADMIN);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Fetch tasks for all users
        const tasksData = await TaskService.getTasks();
        setTasks(tasksData);

        // Fetch solutions if student
        if (isStudent) {
          const solutionsData = await TaskSolutionService.getMyTaskSolutions();
          setSolutions(solutionsData);
        }

        // Fetch reviews if mentor or admin
        if (isMentor || isAdmin) {
          const reviewsData = await TaskSolutionReviewService.getReviews();
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isStudent, isMentor, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          {(isAdmin || isMentor) && (
            <Button asChild>
              <Link to="/admin/create-task">Create Task</Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild variant="outline">
              <Link to="/admin/bulk-import">Bulk Import</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Card */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <span className="bg-primary/10 text-primary font-medium px-2 py-1 rounded text-sm">
              {tasks.length} Total
            </span>
          </div>

          <div className="space-y-4">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="border-b pb-3 last:border-0">
                <Link
                  to={`/tasks/${task.id}`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {task.title}
                </Link>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {task.description}
                </p>
              </div>
            ))}
          </div>

          <Button asChild variant="ghost" className="w-full mt-4">
            <Link to="/tasks">View All Tasks</Link>
          </Button>
        </div>

        {/* Student-specific: My Solutions Card */}
        {isStudent && (
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Submissions</h2>
              <span className="bg-primary/10 text-primary font-medium px-2 py-1 rounded text-sm">
                {solutions.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {solutions.slice(0, 3).map((solution) => (
                <div key={solution.id} className="border-b pb-3 last:border-0">
                  <Link
                    to={`/solutions/${solution.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    Solution #{solution.id}
                  </Link>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground text-sm">
                      Task #{solution.taskId}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        solution.status === 'reviewed'
                          ? 'text-green-600'
                          : solution.status === 'in_review'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                      }`}
                    >
                      {solution.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild variant="ghost" className="w-full mt-4">
              <Link to="/my-solutions">View All Submissions</Link>
            </Button>
          </div>
        )}

        {/* Mentor/Admin-specific: Reviews Card */}
        {(isMentor || isAdmin) && (
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <span className="bg-primary/10 text-primary font-medium px-2 py-1 rounded text-sm">
                {reviews.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b pb-3 last:border-0">
                  <Link
                    to={`/admin/reviews/${review.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    Review #{review.id}
                  </Link>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground text-sm">
                      Solution #{review.taskSolutionId}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        review.source === 'manual'
                          ? 'text-indigo-600'
                          : review.source === 'auto_approved'
                            ? 'text-green-600'
                            : review.source === 'auto_modified'
                              ? 'text-amber-600'
                              : 'text-blue-600'
                      }`}
                    >
                      {review.source.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild variant="ghost" className="w-full mt-4">
              <Link to="/admin/reviews">View All Reviews</Link>
            </Button>
          </div>
        )}

        {/* Code Checker Card - Available to all users */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Code Checker</h2>
            <span className="bg-primary/10 text-primary font-medium px-2 py-1 rounded text-sm">
              Test Your Code
            </span>
          </div>

          <p className="text-muted-foreground mb-4">
            Run the code checker to test your code against predefined test cases
            and get instant feedback.
          </p>

          <Button asChild className="w-full">
            <Link to="/checker">Open Checker</Link>
          </Button>
        </div>

        {/* Admin-specific: Bulk Import Card */}
        {isAdmin && (
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Bulk Import</h2>
              <span className="bg-primary/10 text-primary font-medium px-2 py-1 rounded text-sm">
                Admin Tool
              </span>
            </div>

            <p className="text-muted-foreground mb-4">
              Import multiple tasks at once by uploading a CSV or JSON file with
              task data.
            </p>

            <Button asChild className="w-full">
              <Link to="/admin/bulk-import">Import Tasks</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
