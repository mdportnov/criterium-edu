import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssessmentSessionsAndEnhancements1748000000000 implements MigrationInterface {
  name = 'AddAssessmentSessionsAndEnhancements1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create assessment_sessions table
    await queryRunner.query(`
      CREATE TABLE "assessment_sessions" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
        "initiated_by_id" integer,
        "llm_model" character varying NOT NULL DEFAULT 'gpt-4o',
        "system_prompt" text,
        "temperature" numeric(3,2) DEFAULT 0.7,
        "max_tokens" integer DEFAULT 2000,
        "total_solutions" integer NOT NULL DEFAULT 0,
        "processed_solutions" integer NOT NULL DEFAULT 0,
        "successful_assessments" integer NOT NULL DEFAULT 0,
        "failed_assessments" integer NOT NULL DEFAULT 0,
        "solution_ids" json NOT NULL,
        "task_info" json,
        "start_time" TIMESTAMP,
        "last_updated" TIMESTAMP,
        "completion_time" TIMESTAMP,
        "total_processing_time" bigint,
        "average_processing_time" integer,
        "total_tokens" integer,
        "total_cost" numeric(10,6),
        "score_distribution" json,
        "errors" json,
        "metadata" json,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assessment_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assessment_sessions_initiated_by" FOREIGN KEY ("initiated_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Add new columns to auto_assessments table
    await queryRunner.query(`
      ALTER TABLE "auto_assessments" 
      ADD COLUMN "token_usage" integer,
      ADD COLUMN "cost" numeric(10,6),
      ADD COLUMN "processing_time" integer,
      ADD COLUMN "session_id" integer
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_assessment_sessions_status" ON "assessment_sessions" ("status")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_assessment_sessions_initiated_by" ON "assessment_sessions" ("initiated_by_id")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_auto_assessments_session" ON "auto_assessments" ("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_auto_assessments_session"`);
    await queryRunner.query(`DROP INDEX "IDX_assessment_sessions_initiated_by"`);
    await queryRunner.query(`DROP INDEX "IDX_assessment_sessions_status"`);

    // Remove columns from auto_assessments
    await queryRunner.query(`
      ALTER TABLE "auto_assessments" 
      DROP COLUMN "session_id",
      DROP COLUMN "processing_time",
      DROP COLUMN "cost",
      DROP COLUMN "token_usage"
    `);

    // Drop assessment_sessions table
    await queryRunner.query(`DROP TABLE "assessment_sessions"`);
  }
}