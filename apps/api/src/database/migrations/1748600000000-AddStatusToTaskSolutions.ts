import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToTaskSolutions1748600000000 implements MigrationInterface {
  name = 'AddStatusToTaskSolutions1748600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."task_solutions_status_enum" AS ENUM('pending', 'submitted', 'in_review', 'reviewed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" ADD "status" "public"."task_solutions_status_enum" NOT NULL DEFAULT 'submitted'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task_solutions" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."task_solutions_status_enum"`);
  }
}