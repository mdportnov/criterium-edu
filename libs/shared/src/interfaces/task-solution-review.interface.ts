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
  reviewerId?: number;
  criteriaScores: CriterionScore[];
  totalScore: number;
  feedbackToStudent: string;
  reviewerComment?: string;
  source: ReviewSource;
  createdAt: Date;
  updatedAt: Date;
}
