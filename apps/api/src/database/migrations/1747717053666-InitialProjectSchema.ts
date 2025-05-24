import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialProjectSchema1747717053666 implements MigrationInterface {
  name = 'InitialProjectSchema1747717053666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'reviewer', 'student')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_criteria" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "maxPoints" numeric(5,2) NOT NULL, "checkerComments" text, "taskId" integer NOT NULL, CONSTRAINT "PK_6554800928693e144a72fbca034" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "authorSolution" text, "categories" text, "tags" text, "createdBy" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "criterion_scores" ("id" SERIAL NOT NULL, "reviewId" integer NOT NULL, "criterionId" integer NOT NULL, "score" numeric(10,2) NOT NULL, "comment" text, CONSTRAINT "PK_c19ea124c8d83836d6a79df1b4e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_solution_reviews_source_enum" AS ENUM('auto', 'manual', 'auto_approved', 'auto_modified')`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_solution_reviews" ("id" SERIAL NOT NULL, "taskSolutionId" integer NOT NULL, "reviewerId" integer, "totalScore" numeric(10,2) NOT NULL, "feedbackToStudent" text NOT NULL, "reviewerComment" text, "source" "public"."task_solution_reviews_source_enum" NOT NULL DEFAULT 'auto', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d553c07f1c0de6164a629d7545f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "solution_sources" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_889fc19bc69578217842638fc34" UNIQUE ("name"), CONSTRAINT "PK_abd42357c6a62895989727e4114" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_solutions" ("id" SERIAL NOT NULL, "content" text NOT NULL, "externalId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, "task_id" integer, "source_id" integer, CONSTRAINT "PK_b15c307854fd002eb208ff396d3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auto_assessments" ("id" SERIAL NOT NULL, "criteriaScores" json NOT NULL, "comments" text NOT NULL, "totalScore" numeric(5,2) NOT NULL, "llmModel" character varying NOT NULL, "promptUsed" text, "rawResponse" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "solution_id" integer, CONSTRAINT "PK_0013e68f09befa4196b8abdff3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_criteria" ADD CONSTRAINT "FK_6de018b8a8dbe8845ffe811ad20" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_97dd6125cba9c54b7c6cd02b080" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "criterion_scores" ADD CONSTRAINT "FK_01fca65707627df8be5ea9ae2b0" FOREIGN KEY ("reviewId") REFERENCES "task_solution_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "criterion_scores" ADD CONSTRAINT "FK_f1cf1ca1661df3cffaf224a119d" FOREIGN KEY ("criterionId") REFERENCES "task_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solution_reviews" ADD CONSTRAINT "FK_f8eec83616b2b219ffb2f2db838" FOREIGN KEY ("taskSolutionId") REFERENCES "task_solutions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solution_reviews" ADD CONSTRAINT "FK_477dbd1684d6c020c0cf903efe7" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" ADD CONSTRAINT "FK_85c843e8625b1f97b8a2f8b5273" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" ADD CONSTRAINT "FK_01f120a9899193af278e31a9e60" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" ADD CONSTRAINT "FK_cd19f65fdc64ee668377bebf6e5" FOREIGN KEY ("source_id") REFERENCES "solution_sources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auto_assessments" ADD CONSTRAINT "FK_4fee913fd73d11217fc76927b14" FOREIGN KEY ("solution_id") REFERENCES "task_solutions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auto_assessments" DROP CONSTRAINT "FK_4fee913fd73d11217fc76927b14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" DROP CONSTRAINT "FK_cd19f65fdc64ee668377bebf6e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" DROP CONSTRAINT "FK_01f120a9899193af278e31a9e60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" DROP CONSTRAINT "FK_85c843e8625b1f97b8a2f8b5273"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solution_reviews" DROP CONSTRAINT "FK_477dbd1684d6c020c0cf903efe7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solution_reviews" DROP CONSTRAINT "FK_f8eec83616b2b219ffb2f2db838"`,
    );
    await queryRunner.query(
      `ALTER TABLE "criterion_scores" DROP CONSTRAINT "FK_f1cf1ca1661df3cffaf224a119d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "criterion_scores" DROP CONSTRAINT "FK_01fca65707627df8be5ea9ae2b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_97dd6125cba9c54b7c6cd02b080"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_criteria" DROP CONSTRAINT "FK_6de018b8a8dbe8845ffe811ad20"`,
    );
    await queryRunner.query(`DROP TABLE "auto_assessments"`);
    await queryRunner.query(`DROP TABLE "task_solutions"`);
    await queryRunner.query(`DROP TABLE "solution_sources"`);
    await queryRunner.query(`DROP TABLE "task_solution_reviews"`);
    await queryRunner.query(
      `DROP TYPE "public"."task_solution_reviews_source_enum"`,
    );
    await queryRunner.query(`DROP TABLE "criterion_scores"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "task_criteria"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
