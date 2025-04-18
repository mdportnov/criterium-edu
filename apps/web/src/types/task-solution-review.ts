export interface CriterionScore {
  criterionId: number;
  score: number;
  comment?: string;
}

export enum ReviewSource {
  AUTO = 'auto',
  MANUAL = 'manual',
  AUTO_APPROVED = 'auto_approved',
  AUTO_MODIFIED = 'auto_modified',
}

export interface TaskSolutionReview {
  id: number;
  taskSolutionId: number;
  mentorId?: number;
  criteriaScores: CriterionScore[];
  totalScore: number;
  feedbackToStudent: string;
  mentorComment?: string;
  source: ReviewSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskSolutionReviewPayload {
  taskSolutionId: number;
  criteriaScores: Omit<CriterionScore, 'id'>[];
  feedbackToStudent: string;
  mentorComment?: string;
  source: ReviewSource;
}

export interface UpdateTaskSolutionReviewPayload {
  criteriaScores?: Partial<CriterionScore>[];
  feedbackToStudent?: string;
  mentorComment?: string;
  source?: ReviewSource;
}
