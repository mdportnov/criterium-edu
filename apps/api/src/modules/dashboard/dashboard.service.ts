import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskSolutionReview } from '../task-solution-reviews/entities/task-solution-review.entity';
import { User } from '../users/entities/user.entity';
import { TaskSolutionStatus } from '@app/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TaskSolution)
    private readonly taskSolutionRepo: Repository<TaskSolution>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskSolutionReview)
    private readonly reviewRepo: Repository<TaskSolutionReview>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getOverview() {
    const [
      totalTasks,
      totalSolutions,
      totalReviews,
      totalUsers,
      pendingSolutions,
      submittedSolutions,
      reviewedSolutions,
    ] = await Promise.all([
      this.taskRepo.count(),
      this.taskSolutionRepo.count(),
      this.reviewRepo.count(),
      this.userRepo.count(),
      this.taskSolutionRepo.count({
        where: { status: TaskSolutionStatus.PENDING },
      }),
      this.taskSolutionRepo.count({
        where: { status: TaskSolutionStatus.SUBMITTED },
      }),
      this.taskSolutionRepo.count({
        where: { status: TaskSolutionStatus.REVIEWED },
      }),
    ]);

    return {
      totalTasks,
      totalSolutions,
      totalReviews,
      totalUsers,
      solutionStatusBreakdown: {
        pending: pendingSolutions,
        submitted: submittedSolutions,
        inReview: await this.taskSolutionRepo.count({
          where: { status: TaskSolutionStatus.IN_REVIEW },
        }),
        reviewed: reviewedSolutions,
      },
      processingRate:
        totalSolutions > 0
          ? Math.round((reviewedSolutions / totalSolutions) * 100)
          : 0,
    };
  }

  async getTaskStatistics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasksCreated = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.createdAt >= :startDate', { startDate })
      .getCount();

    const tasksWithSolutions = await this.taskRepo
      .createQueryBuilder('task')
      .innerJoin('task_solutions', 'solution', 'solution.task_id = task.id')
      .where('task.createdAt >= :startDate', { startDate })
      .getCount();

    const dailyStats = await this.getDailyTaskStats(days);

    return {
      period,
      tasksCreated,
      tasksWithSolutions,
      tasksWithoutSolutions: tasksCreated - tasksWithSolutions,
      utilizationRate:
        tasksCreated > 0
          ? Math.round((tasksWithSolutions / tasksCreated) * 100)
          : 0,
      dailyBreakdown: dailyStats,
    };
  }

  async getSolutionStatistics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const solutions = await this.taskSolutionRepo
      .createQueryBuilder('solution')
      .where('solution.createdAt >= :startDate', { startDate })
      .getMany();

    const statusCounts = solutions.reduce(
      (acc, solution) => {
        acc[solution.status] = (acc[solution.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dailyStats = await this.getDailySolutionStats(days);

    return {
      period,
      totalSolutions: solutions.length,
      statusBreakdown: {
        pending: statusCounts[TaskSolutionStatus.PENDING] || 0,
        submitted: statusCounts[TaskSolutionStatus.SUBMITTED] || 0,
        inReview: statusCounts[TaskSolutionStatus.IN_REVIEW] || 0,
        reviewed: statusCounts[TaskSolutionStatus.REVIEWED] || 0,
      },
      dailyBreakdown: dailyStats,
    };
  }

  async getReviewStatistics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviews = await this.reviewRepo
      .createQueryBuilder('review')
      .where('review.createdAt >= :startDate', { startDate })
      .getMany();

    const averageScore =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.totalScore, 0) /
          reviews.length
        : 0;

    const dailyStats = await this.getDailyReviewStats(days);

    return {
      period,
      totalReviews: reviews.length,
      averageScore: Math.round(averageScore * 100) / 100,
      dailyBreakdown: dailyStats,
    };
  }

  async getRecentActivity(limit: number) {
    const recentSolutions = await this.taskSolutionRepo
      .createQueryBuilder('solution')
      .leftJoinAndSelect('solution.task', 'task')
      .leftJoinAndSelect('solution.user', 'user')
      .orderBy('solution.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    const recentReviews: TaskSolutionReview[] = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.taskSolution', 'solution')
      .leftJoinAndSelect('solution.task', 'task')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .orderBy('review.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    const activities = [
      ...recentSolutions.map((solution) => ({
        type: 'solution_submitted',
        timestamp: solution.createdAt,
        taskTitle: solution.task?.title,
        userEmail: solution.user?.email,
        status: solution.status,
      })),
      ...recentReviews.map((review) => ({
        type: 'solution_reviewed',
        timestamp: review.createdAt,
        taskTitle: review.taskSolution?.task?.title,
        reviewerEmail: review.reviewer?.email,
        score: review.totalScore,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);

    return activities;
  }

  async getPerformanceMetrics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [avgReviewTime, solutionsPerDay, reviewsPerDay, topPerformingTasks] =
      await Promise.all([
        this.getAverageReviewTime(startDate),
        this.getAverageSolutionsPerDay(startDate),
        this.getAverageReviewsPerDay(startDate),
        this.getTopPerformingTasks(startDate),
      ]);

    return {
      period,
      averageReviewTimeHours: avgReviewTime,
      averageSolutionsPerDay: solutionsPerDay,
      averageReviewsPerDay: reviewsPerDay,
      topPerformingTasks,
    };
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 7; // default to 7 days

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 'd':
        return num;
      case 'w':
        return num * 7;
      case 'm':
        return num * 30;
      case 'y':
        return num * 365;
      default:
        return 7;
    }
  }

  private async getDailyTaskStats(days: number) {
    const stats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.taskRepo
        .createQueryBuilder('task')
        .where('task.createdAt >= :date', { date })
        .andWhere('task.createdAt < :nextDate', { nextDate })
        .getCount();

      stats.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }
    return stats;
  }

  private async getDailySolutionStats(days: number) {
    const stats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.taskSolutionRepo
        .createQueryBuilder('solution')
        .where('solution.createdAt >= :date', { date })
        .andWhere('solution.createdAt < :nextDate', { nextDate })
        .getCount();

      stats.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }
    return stats;
  }

  private async getDailyReviewStats(days: number) {
    const stats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.reviewRepo
        .createQueryBuilder('review')
        .where('review.createdAt >= :date', { date })
        .andWhere('review.createdAt < :nextDate', { nextDate })
        .getCount();

      stats.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }
    return stats;
  }

  private async getAverageReviewTime(startDate: Date): Promise<number> {
    const reviewedSolutions = await this.taskSolutionRepo
      .createQueryBuilder('solution')
      .innerJoin(
        'task_solution_reviews',
        'review',
        'review.task_solution_id = solution.id',
      )
      .where('solution.status = :status', {
        status: TaskSolutionStatus.REVIEWED,
      })
      .andWhere('solution.createdAt >= :startDate', { startDate })
      .select([
        'solution.createdAt as solution_createdAt',
        'review.createdAt as review_createdAt',
      ])
      .getRawMany();

    if (reviewedSolutions.length === 0) return 0;

    const totalHours = reviewedSolutions.reduce((sum, item) => {
      const submittedAt = new Date(item.solution_createdAt);
      const reviewedAt = new Date(item.review_createdAt);
      const diffHours =
        (reviewedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);

    return Math.round((totalHours / reviewedSolutions.length) * 100) / 100;
  }

  private async getAverageSolutionsPerDay(startDate: Date): Promise<number> {
    const days = Math.ceil(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalSolutions = await this.taskSolutionRepo
      .createQueryBuilder('solution')
      .where('solution.createdAt >= :startDate', { startDate })
      .getCount();

    return Math.round((totalSolutions / days) * 100) / 100;
  }

  private async getAverageReviewsPerDay(startDate: Date): Promise<number> {
    const days = Math.ceil(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalReviews = await this.reviewRepo
      .createQueryBuilder('review')
      .where('review.createdAt >= :startDate', { startDate })
      .getCount();

    return Math.round((totalReviews / days) * 100) / 100;
  }

  private async getTopPerformingTasks(startDate: Date) {
    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoin('task_solutions', 'solution', 'solution.task_id = task.id')
      .leftJoin(
        'task_solution_reviews',
        'review',
        'review.task_solution_id = solution.id',
      )
      .where('solution.createdAt >= :startDate', { startDate })
      .select([
        'task.id',
        'task.title',
        'COUNT(solution.id) as solutionCount',
        'AVG(review.totalScore) as averageScore',
      ])
      .groupBy('task.id, task.title')
      .orderBy('solutionCount', 'DESC')
      .limit(5)
      .getRawMany();

    return tasks.map((task) => ({
      id: task.task_id,
      title: task.task_title,
      solutionCount: parseInt(task.solutionCount, 10),
      averageScore: task.averageScore
        ? Math.round(parseFloat(task.averageScore) * 100) / 100
        : null,
    }));
  }
}
