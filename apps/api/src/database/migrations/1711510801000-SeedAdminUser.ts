import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUser1711510801000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Insert admin user
    await queryRunner.query(`
      INSERT INTO "users" ("email", "firstName", "lastName", "password", "role", "createdAt", "updatedAt")
      VALUES ('admin@criterium-edu.com', 'Admin', 'User', '${hashedPassword}', 'admin', NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = 'admin@criterium-edu.com'`,
    );
  }
}
