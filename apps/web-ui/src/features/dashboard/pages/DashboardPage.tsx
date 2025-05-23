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
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Code2,
  Upload,
  Plus,
  ArrowRight,
  BookOpen,
  Target,
  Activity,
} from 'lucide-react';

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
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-6 rounded-lg border border-destructive/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">Error Loading Dashboard</h3>
        </div>
        <p className="mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-destructive/20 hover:bg-destructive/10"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Calculate statistics
  const pendingSolutions = solutions.filter(
    (s) => s.status === 'pending',
  ).length;
  const reviewedSolutions = solutions.filter(
    (s) => s.status === 'reviewed',
  ).length;
  const pendingReviews = reviews.filter((r) => r.source === 'manual').length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(isAdmin || isMentor) && (
            <Button
              asChild
              className="transition-all duration-200 hover:shadow-lg"
            >
              <Link to="/admin/tasks/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button
              asChild
              variant="outline"
              className="transition-all duration-200 hover:shadow-md"
            >
              <Link to="/admin/bulk-import">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="dashboard-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Tasks
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {tasks.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-700 dark:text-blue-300">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Available for practice</span>
          </div>
        </div>

        {/* Student Stats */}
        {isStudent && (
          <>
            <div className="dashboard-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {reviewedSolutions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-700 dark:text-green-300">
                <Activity className="w-4 h-4 mr-1" />
                <span>Successfully reviewed</span>
              </div>
            </div>

            <div className="dashboard-card bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                    {pendingSolutions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-amber-700 dark:text-amber-300">
                <Target className="w-4 h-4 mr-1" />
                <span>Awaiting review</span>
              </div>
            </div>
          </>
        )}

        {/* Mentor/Admin Stats */}
        {(isMentor || isAdmin) && (
          <div className="dashboard-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  To Review
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {pendingReviews}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-700 dark:text-purple-300">
              <FileText className="w-4 h-4 mr-1" />
              <span>Manual reviews needed</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Card */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-sm border p-6 card-hover">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Recent Tasks</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Practice and improve your skills
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Side Cards */}
        <div className="space-y-6">
          {/* Student Submissions */}
          {isStudent && solutions.length > 0 && (
            <div className="bg-card rounded-lg shadow-sm border p-6 card-hover">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Submissions</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/my-solutions">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {solutions.slice(0, 3).map((solution) => (
                  <Link
                    key={solution.id}
                    to={`/solutions/${solution.id}`}
                    className="block p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          Solution #{solution.id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Task #{solution.taskId}
                        </p>
                      </div>
                      <span
                        className={`status-badge ${
                          solution.status === 'reviewed'
                            ? 'success'
                            : solution.status === 'in_review'
                              ? 'warning'
                              : 'info'
                        }`}
                      >
                        {solution.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Code Checker */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <Code2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span className="status-badge info">Quick Test</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Code Checker</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Test your code against predefined test cases and get instant
              feedback.
            </p>
            <Button asChild className="w-full">
              <Link to="/checker">
                Open Checker
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border border-rose-200 dark:border-rose-800 rounded-lg p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <Upload className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                <span className="status-badge error">Admin</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Bulk Import</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import multiple tasks at once using CSV or JSON files.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/bulk-import">
                  Import Tasks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
