import { api } from './api';

export interface DashboardOverview {
  totalTasks: number;
  totalSolutions: number;
  totalReviews: number;
  totalUsers: number;
  solutionStatusBreakdown: {
    pending: number;
    submitted: number;
    inReview: number;
    reviewed: number;
  };
  processingRate: number;
}

export interface TaskStatistics {
  period: string;
  tasksCreated: number;
  tasksWithSolutions: number;
  tasksWithoutSolutions: number;
  utilizationRate: number;
  dailyBreakdown: Array<{
    date: string;
    count: number;
  }>;
}

export interface SolutionStatistics {
  period: string;
  totalSolutions: number;
  statusBreakdown: {
    pending: number;
    submitted: number;
    inReview: number;
    reviewed: number;
  };
  dailyBreakdown: Array<{
    date: string;
    count: number;
  }>;
}

export interface ReviewStatistics {
  period: string;
  totalReviews: number;
  averageScore: number;
  dailyBreakdown: Array<{
    date: string;
    count: number;
  }>;
}

export interface RecentActivity {
  type: 'solution_submitted' | 'solution_reviewed';
  timestamp: string;
  taskTitle?: string;
  userEmail?: string;
  reviewerEmail?: string;
  status?: string;
  score?: number;
}

export interface PerformanceMetrics {
  period: string;
  averageReviewTimeHours: number;
  averageSolutionsPerDay: number;
  averageReviewsPerDay: number;
  topPerformingTasks: Array<{
    id: number;
    title: string;
    solutionCount: number;
    averageScore: number | null;
  }>;
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await api.get('/dashboard/overview');
    return data;
  },

  async getTaskStatistics(period: string = '7d'): Promise<TaskStatistics> {
    const { data } = await api.get(`/dashboard/task-statistics?period=${period}`);
    return data;
  },

  async getSolutionStatistics(period: string = '7d'): Promise<SolutionStatistics> {
    const { data } = await api.get(`/dashboard/solution-statistics?period=${period}`);
    return data;
  },

  async getReviewStatistics(period: string = '7d'): Promise<ReviewStatistics> {
    const { data } = await api.get(`/dashboard/review-statistics?period=${period}`);
    return data;
  },

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const { data } = await api.get(`/dashboard/recent-activity?limit=${limit}`);
    return data;
  },

  async getPerformanceMetrics(period: string = '30d'): Promise<PerformanceMetrics> {
    const { data } = await api.get(`/dashboard/performance-metrics?period=${period}`);
    return data;
  },
};