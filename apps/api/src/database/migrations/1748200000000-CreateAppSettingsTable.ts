import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppSettingsTable1748200000000 implements MigrationInterface {
  name = 'CreateAppSettingsTable1748200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'app_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Insert default settings
    await queryRunner.query(`
      INSERT INTO app_settings (key, value, description) VALUES 
      ('registration_enabled', 'true', 'Enable or disable user registration'),
      ('openai_api_key', '', 'OpenAI API key for LLM services')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('app_settings');
  }
}
