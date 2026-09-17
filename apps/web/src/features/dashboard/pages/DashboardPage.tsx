import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Stat, StatInline, StatRow } from '@/components/ui/stat';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  dashboardService,
  type DashboardOverview,
  type RecentActivity,
  type SolutionStatistics,
  type TaskStatistics,
} from '@/services/dashboard.service';
import { ArrowRight, CheckCircle2, FileText, Lock, Plus } from 'lucide-react';
import { UserRole } from '@app/shared/interfaces';

const PERIODS = [
  { value: '1d', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const PERIOD_LABEL: Record<string, string> = {
  '1d': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
};

const DashboardPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [solutionStats, setSolutionStats] = useState<SolutionStatistics | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7d');

  const isAdmin = hasRole(UserRole.ADMIN);
  const isReviewerOrAdmin = hasRole(UserRole.REVIEWER) || isAdmin;

  const fetchDashboardData = useCallback(async () => {
    if (!isReviewerOrAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [overviewData, taskStatsData, solutionStatsData, activityData] =
        await Promise.all([
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
      setError(
        'The dashboard service did not respond. Your data is unaffected.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isReviewerOrAdmin, period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!isReviewerOrAdmin) {
    return (
      <Card>
        <EmptyState
          icon={Lock}
          title="This overview is for teachers and administrators"
          description="Your submissions and their results are on the My submissions screen."
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard/my-solutions">Go to my submissions</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'solution_submitted':
        return `Solution submitted for “${activity.taskTitle}”`;
      case 'solution_reviewed':
        return `Solution reviewed for “${activity.taskTitle}”`;
      default:
        return 'Activity';
    }
  };

  const periodLabel = PERIOD_LABEL[period] ?? period;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Throughput across tasks, submissions and reviews."
        actions={
          <>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[9.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button asChild>
                <Link to="/dashboard/tasks/create">
                  <Plus className="size-4" />
                  New task
                </Link>
              </Button>
            )}
          </>
        }
      />

      {error ? (
        <ErrorState
          title="Could not load the overview"
          message={error}
          onRetry={fetchDashboardData}
        />
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-4">
          {/*
            All time. One strip, one type treatment, no colour: these four numbers are
            peers and nothing here ranks them against each other.
          */}
          {overview && (
            <StatRow columns={4}>
              <Stat
                label="Tasks"
                value={overview.totalTasks}
                hint="in the library"
                to="/dashboard/tasks"
              />
              <Stat
                label="Solutions"
                value={overview.totalSolutions}
                hint="submitted all time"
              />
              <Stat
                label="Reviews"
                value={overview.totalReviews}
                hint="completed all time"
                to="/dashboard/reviews"
              />
              <Stat
                label="Processing rate"
                value={`${overview.processingRate}%`}
                hint="solutions reviewed"
              />
            </StatRow>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {overview && (
                <Card>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>Solution pipeline</CardTitle>
                    </CardHeaderText>
                    <CardAction>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/dashboard/reviews">
                          Open queue
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {overview.totalSolutions === 0 ? (
                      <EmptyState
                        title="No solutions submitted yet"
                        description="Once students submit against a task, the pipeline breakdown appears here."
                        action={
                          <Button asChild variant="outline" size="sm">
                            <Link to="/dashboard/tasks">Browse tasks</Link>
                          </Button>
                        }
                        className="max-w-none py-4 [&>p]:max-w-none"
                      />
                    ) : (
                      <StatInline
                        items={[
                          {
                            label: 'Pending',
                            value: overview.solutionStatusBreakdown.pending,
                          },
                          {
                            label: 'Submitted',
                            value: overview.solutionStatusBreakdown.submitted,
                          },
                          {
                            label: 'In review',
                            value: overview.solutionStatusBreakdown.inReview,
                          },
                          {
                            label: 'Reviewed',
                            value: overview.solutionStatusBreakdown.reviewed,
                          },
                        ]}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {taskStats && (
                <Card>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>Tasks</CardTitle>
                    </CardHeaderText>
                    <CardAction>
                      <span className="text-xs text-muted-foreground">
                        {periodLabel}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <StatInline
                      className="sm:grid-cols-3"
                      items={[
                        { label: 'Created', value: taskStats.tasksCreated },
                        {
                          label: 'With solutions',
                          value: taskStats.tasksWithSolutions,
                        },
                        {
                          label: 'Utilisation',
                          value: `${taskStats.utilizationRate}%`,
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              )}

              {solutionStats && (
                <Card>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>Solutions</CardTitle>
                    </CardHeaderText>
                    <CardAction>
                      <span className="text-xs text-muted-foreground">
                        {periodLabel}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <StatInline
                      items={[
                        { label: 'Total', value: solutionStats.totalSolutions },
                        {
                          label: 'Pending',
                          value: solutionStats.statusBreakdown.pending,
                        },
                        {
                          label: 'Submitted',
                          value: solutionStats.statusBreakdown.submitted,
                        },
                        {
                          label: 'Reviewed',
                          value: solutionStats.statusBreakdown.reviewed,
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="lg:self-start">
              <CardHeader>
                <CardHeaderText>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeaderText>
                {recentActivity.length > 0 && (
                  <CardAction>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard/reviews">
                        All
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </CardAction>
                )}
              </CardHeader>
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="Nothing has happened yet"
                  description="Submissions and completed reviews show up here as they arrive."
                  className="py-8"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recentActivity.map((activity, index) => (
                    <li
                      key={`${activity.timestamp}-${index}`}
                      className="flex items-start gap-2.5 px-4 py-2.5"
                    >
                      {activity.type === 'solution_reviewed' ? (
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] leading-5 text-foreground">
                          {getActivityText(activity)}
                          {activity.score != null && (
                            <span className="tabular-nums text-muted-foreground">
                              {' '}
                              · {activity.score}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {activity.userEmail || activity.reviewerEmail} ·{' '}
                          <time dateTime={activity.timestamp}>
                            {formatDateTime(activity.timestamp)}
                          </time>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 divide-y divide-border rounded-md border border-border bg-card sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-14" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <Skeleton className="h-3.5 w-32" />
              </div>
              <div className="p-4">
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
