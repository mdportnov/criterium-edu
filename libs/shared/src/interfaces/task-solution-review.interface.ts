export interface CriterionScore {
  criterionId: string;
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
  id: string;
  taskSolutionId: string;
  reviewerId?: string;
  criteriaScores: CriterionScore[];
  totalScore: number;
  feedbackToStudent: string;
  reviewerComment?: string;
  source: ReviewSource;
  createdAt: Date;
  updatedAt: Date;
}
