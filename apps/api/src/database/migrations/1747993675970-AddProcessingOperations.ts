import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessingOperations1747993675970
  implements MigrationInterface
{
  name = 'AddProcessingOperations1747993675970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."processing_operations_type_enum" AS ENUM('bulk_solution_import', 'llm_assessment')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."processing_operations_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "processing_operations"
       (
         "id"             uuid                                         NOT NULL DEFAULT uuid_generate_v4(),
         "type"           "public"."processing_operations_type_enum"   NOT NULL,
         "status"         "public"."processing_operations_status_enum" NOT NULL DEFAULT 'pending',
         "progress"       integer                                      NOT NULL DEFAULT '0',
         "totalItems"     integer                                      NOT NULL DEFAULT '0',
         "processedItems" integer                                      NOT NULL DEFAULT '0',
         "errorMessage"   text,
         "metadata"       json,
         "createdAt"      TIMESTAMP                                    NOT NULL DEFAULT now(),
         "updatedAt"      TIMESTAMP                                    NOT NULL DEFAULT now(),
         CONSTRAINT "PK_processing_operations_id" PRIMARY KEY ("id")
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "processing_operations"`);
    await queryRunner.query(
      `DROP TYPE "public"."processing_operations_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."processing_operations_type_enum"`,
    );
  }
}
