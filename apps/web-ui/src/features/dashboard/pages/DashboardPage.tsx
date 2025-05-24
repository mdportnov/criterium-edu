import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboardService, type DashboardOverview, type TaskStatistics, type SolutionStatistics, type RecentActivity } from '@/services/dashboard.service';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
  BookOpen,
  Target,
  Activity,
  BarChart3,
  Calendar,
  Zap,
  Timer,
  Award,
  Database
} from 'lucide-react';
import { UserRole } from '@app/shared';

const DashboardPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [solutionStats, setSolutionStats] = useState<SolutionStatistics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7d');

  const isReviewer = hasRole(UserRole.REVIEWER);
  const isAdmin = hasRole(UserRole.ADMIN);
  const isTeacherOrAdmin = isReviewer || isAdmin;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isTeacherOrAdmin) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const [overviewData, taskStatsData, solutionStatsData, activityData] = await Promise.all([
          dashboardService.getOverview(),
          dashboardService.getTaskStatistics(period),
          dashboardService.getSolutionStatistics(period),
          dashboardService.getRecentActivity(8),
        ]);

        setOverview(overviewData);
        setTaskStats(taskStatsData);
        setSolutionStats(solutionStatsData);
        setRecentActivity(activityData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isTeacherOrAdmin, period]);

  if (!isTeacherOrAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            This dashboard is only available for teachers and administrators.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Loading dashboard analytics...</span>
        </div>
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'solution_submitted':
        return <FileText className="w-4 h-4" />;
      case 'solution_reviewed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'solution_submitted':
        return `Solution submitted for "${activity.taskTitle}"`;
      case 'solution_reviewed':
        return `Solution reviewed for "${activity.taskTitle}" (Score: ${activity.score})`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            System overview and performance metrics for {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last Day</SelectItem>
                <SelectItem value="7d">Last Week</SelectItem>
                <SelectItem value="30d">Last Month</SelectItem>
                <SelectItem value="90d">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button asChild size="sm">
                <Link to="/dashboard/tasks/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 dashboard-card-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Tasks</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                  {overview.totalTasks}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-700 dark:text-blue-300">
              <Database className="w-4 h-4 mr-1" />
              <span>Available in system</span>
            </div>
          </Card>

          <Card className="p-6 dashboard-card-green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Solutions</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300 mt-1">
                  {overview.totalSolutions}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-700 dark:text-green-300">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Submitted by students</span>
            </div>
          </Card>

          <Card className="p-6 dashboard-card-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Reviews</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                  {overview.totalReviews}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-700 dark:text-purple-300">
              <Award className="w-4 h-4 mr-1" />
              <span>Completed assessments</span>
            </div>
          </Card>

          <Card className="p-6 dashboard-card-orange">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Processing Rate</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-300 mt-1">
                  {overview.processingRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-orange-700 dark:text-orange-300">
              <Target className="w-4 h-4 mr-1" />
              <span>Solutions reviewed</span>
            </div>
          </Card>
        </div>
      )}

      {/* Solution Status Breakdown */}
      {overview && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Solution Status Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 dashboard-card-yellow rounded-lg">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {overview.solutionStatusBreakdown.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex items-center justify-between p-4 dashboard-card-blue rounded-lg">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Submitted</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {overview.solutionStatusBreakdown.submitted}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center justify-between p-4 dashboard-card-orange rounded-lg">
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-300">In Review</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                  {overview.solutionStatusBreakdown.inReview}
                </p>
              </div>
              <Timer className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex items-center justify-between p-4 dashboard-card-green rounded-lg">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Reviewed</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {overview.solutionStatusBreakdown.reviewed}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Period Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {taskStats && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Task Statistics ({taskStats.period})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 dashboard-card-blue rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {taskStats.tasksCreated}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Tasks Created</p>
                </div>
                <div className="text-center p-4 dashboard-card-green rounded-lg">
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {taskStats.tasksWithSolutions}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">With Solutions</p>
                </div>
                <div className="text-center p-4 dashboard-card-orange rounded-lg">
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                    {taskStats.utilizationRate}%
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Utilization Rate</p>
                </div>
              </div>
            </Card>
          )}

          {solutionStats && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Solution Statistics ({solutionStats.period})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-300  rounded-lg border">
                  <p className="text-2xl font-bold">{solutionStats.totalSolutions}</p>
                  <p className="text-sm text-muted-foreground">Total Solutions</p>
                </div>
                <div className="text-center p-4 dashboard-card-yellow rounded-lg">
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                    {solutionStats.statusBreakdown.pending}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending</p>
                </div>
                <div className="text-center p-4 dashboard-card-blue rounded-lg">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {solutionStats.statusBreakdown.submitted}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Submitted</p>
                </div>
                <div className="text-center p-4 dashboard-card-green rounded-lg">
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {solutionStats.statusBreakdown.reviewed}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Reviewed</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/reviews">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.userEmail || activity.reviewerEmail} • {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link to="/dashboard/tasks">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View All Tasks
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link to="/dashboard/reviews">
                  <Users className="w-4 h-4 mr-2" />
                  Review Solutions
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;