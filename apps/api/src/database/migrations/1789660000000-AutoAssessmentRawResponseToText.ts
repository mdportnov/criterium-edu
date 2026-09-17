import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoAssessmentRawResponseToText1789660000000 implements MigrationInterface {
  name = 'AutoAssessmentRawResponseToText1789660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // auto_assessments.rawResponse held the model's reply, which is free text
    // and regularly not valid JSON. Declaring it json meant every write had to
    // be wrapped and every read unwrapped.
    await queryRunner.query(
      `ALTER TABLE "auto_assessments" ALTER COLUMN "rawResponse" TYPE text USING "rawResponse"#>>'{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auto_assessments" ALTER COLUMN "rawResponse" TYPE json USING to_json("rawResponse")`,
    );
  }
}
