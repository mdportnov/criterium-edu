import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711510800000 implements MigrationInterface {
  name = 'InitialSchema1711510800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'mentor', 'student')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_solution_status_enum" AS ENUM('submitted', 'in_review', 'reviewed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_source_enum" AS ENUM('auto', 'manual', 'auto_approved', 'auto_modified')`,
    );

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'student',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Create tasks table
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "authorSolution" text,
        "createdBy" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
      )
    `);

    // Create task_criteria table
    await queryRunner.query(`
      CREATE TABLE "task_criteria" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "maxPoints" numeric(5,2) NOT NULL,
        "checkerComments" text,
        "taskId" integer NOT NULL,
        CONSTRAINT "PK_9d051ac4b171cf0b003fd36c0ed" PRIMARY KEY ("id")
      )
    `);

    // Create task_solutions table
    await queryRunner.query(`
      CREATE TABLE "task_solutions" (
        "id" SERIAL NOT NULL,
        "taskId" integer NOT NULL,
        "studentId" integer NOT NULL,
        "solutionText" text NOT NULL,
        "status" "public"."task_solution_status_enum" NOT NULL DEFAULT 'submitted',
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_5071ca0369a69bafbd0b6c76415" PRIMARY KEY ("id")
      )
    `);

    // Create task_solution_reviews table
    await queryRunner.query(`
      CREATE TABLE "task_solution_reviews" (
        "id" SERIAL NOT NULL,
        "taskSolutionId" integer NOT NULL,
        "mentorId" integer,
        "totalScore" numeric(10,2) NOT NULL,
        "feedbackToStudent" text NOT NULL,
        "mentorComment" text,
        "source" "public"."review_source_enum" NOT NULL DEFAULT 'auto',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ebfcd4c45b5a05fe136a34932c8" PRIMARY KEY ("id")
      )
    `);

    // Create criterion_scores table
    await queryRunner.query(`
      CREATE TABLE "criterion_scores" (
        "id" SERIAL NOT NULL,
        "reviewId" integer NOT NULL,
        "criterionId" integer NOT NULL,
        "score" numeric(10,2) NOT NULL,
        "comment" text,
        CONSTRAINT "PK_57ba1e56745d03e6f70713e0f17" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "tasks" ADD CONSTRAINT "FK_9ee8b060fc18ad253eb08a7f610" 
      FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_criteria" ADD CONSTRAINT "FK_c0c8237e345b3a639a2b8f81d80" 
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_solutions" ADD CONSTRAINT "FK_d8e6e55f966b41e7c1e6d5ba46e" 
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_solutions" ADD CONSTRAINT "FK_a7eb4b7c8e066d0c3af927628ec" 
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_solution_reviews" ADD CONSTRAINT "FK_32d811e8e054bd8d45a17ce4a7b" 
      FOREIGN KEY ("taskSolutionId") REFERENCES "task_solutions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "task_solution_reviews" ADD CONSTRAINT "FK_6b90b77b4b0f3c11a2fb92e9768" 
      FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "criterion_scores" ADD CONSTRAINT "FK_9a46d3c152b5a557cafbc51f5fc" 
      FOREIGN KEY ("reviewId") REFERENCES "task_solution_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "criterion_scores" ADD CONSTRAINT "FK_a8d48959274c3b50f1ef77f3108" 
      FOREIGN KEY ("criterionId") REFERENCES "task_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "criterion_scores" DROP CONSTRAINT "FK_a8d48959274c3b50f1ef77f3108"`,
    );
    await queryRunner.query(
      `ALTER TABLE "criterion_scores" DROP CONSTRAINT "FK_9a46d3c152b5a557cafbc51f5fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solution_reviews" DROP CONSTRAINT "FK_6b90b77b4b0f3c11a2fb92e9768"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solution_reviews" DROP CONSTRAINT "FK_32d811e8e054bd8d45a17ce4a7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" DROP CONSTRAINT "FK_a7eb4b7c8e066d0c3af927628ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_solutions" DROP CONSTRAINT "FK_d8e6e55f966b41e7c1e6d5ba46e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_criteria" DROP CONSTRAINT "FK_c0c8237e345b3a639a2b8f81d80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9ee8b060fc18ad253eb08a7f610"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "criterion_scores"`);
    await queryRunner.query(`DROP TABLE "task_solution_reviews"`);
    await queryRunner.query(`DROP TABLE "task_solutions"`);
    await queryRunner.query(`DROP TABLE "task_criteria"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."review_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."task_solution_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
