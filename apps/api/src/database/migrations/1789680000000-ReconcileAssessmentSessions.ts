import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * assessment_sessions was created with one design and the entity written
 * against another, so every read of the table failed - the whole assessment
 * sessions feature has never worked. The entity is what the service is
 * written against, so the table is brought to match it.
 *
 * The dropped columns were never readable and so were never populated:
 * temperature/max_tokens are superseded by `configuration`, the per-run totals
 * by `statistics`, and task_info by `metadata`.
 */
export class ReconcileAssessmentSessions1789680000000 implements MigrationInterface {
  name = 'ReconcileAssessmentSessions1789680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assessment_sessions"
        ADD COLUMN IF NOT EXISTS "task_id" uuid,
        ADD COLUMN IF NOT EXISTS "configuration" json,
        ADD COLUMN IF NOT EXISTS "progress" numeric(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "error_message" text,
        ADD COLUMN IF NOT EXISTS "statistics" json
    `);

    await queryRunner.query(`
      ALTER TABLE "assessment_sessions"
        ADD CONSTRAINT "FK_assessment_sessions_task"
        FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "assessment_sessions"
        DROP COLUMN IF EXISTS "temperature",
        DROP COLUMN IF EXISTS "max_tokens",
        DROP COLUMN IF EXISTS "task_info",
        DROP COLUMN IF EXISTS "start_time",
        DROP COLUMN IF EXISTS "last_updated",
        DROP COLUMN IF EXISTS "total_processing_time",
        DROP COLUMN IF EXISTS "average_processing_time",
        DROP COLUMN IF EXISTS "total_tokens",
        DROP COLUMN IF EXISTS "total_cost",
        DROP COLUMN IF EXISTS "score_distribution"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assessment_sessions"
        ADD COLUMN IF NOT EXISTS "temperature" numeric(3,2) DEFAULT 0.7,
        ADD COLUMN IF NOT EXISTS "max_tokens" integer DEFAULT 2000,
        ADD COLUMN IF NOT EXISTS "task_info" json,
        ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "last_updated" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "total_processing_time" bigint,
        ADD COLUMN IF NOT EXISTS "average_processing_time" integer,
        ADD COLUMN IF NOT EXISTS "total_tokens" integer,
        ADD COLUMN IF NOT EXISTS "total_cost" numeric(10,6),
        ADD COLUMN IF NOT EXISTS "score_distribution" json
    `);

    await queryRunner.query(
      `ALTER TABLE "assessment_sessions" DROP CONSTRAINT IF EXISTS "FK_assessment_sessions_task"`,
    );

    await queryRunner.query(`
      ALTER TABLE "assessment_sessions"
        DROP COLUMN IF EXISTS "task_id",
        DROP COLUMN IF EXISTS "configuration",
        DROP COLUMN IF EXISTS "progress",
        DROP COLUMN IF EXISTS "error_message",
        DROP COLUMN IF EXISTS "statistics"
    `);
  }
}
