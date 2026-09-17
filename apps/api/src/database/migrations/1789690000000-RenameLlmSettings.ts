import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The OpenAI client became a provider-agnostic one, so the settings that
 * configure it lose the vendor name.
 *
 * The values are copied, not moved: the old rows stay until an administrator
 * saves the settings screen once. A deployment that rolls back keeps working,
 * and the service reads the old names as a fallback either way.
 */
export class RenameLlmSettings1789690000000 implements MigrationInterface {
  name = 'RenameLlmSettings1789690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "app_settings" ("key", "value", "description")
      SELECT 'llm_api_key', "value",
             'API key for the configured language-model provider (encrypted at rest)'
      FROM "app_settings" WHERE "key" = 'openai_api_key'
      ON CONFLICT ("key") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "app_settings" ("key", "value", "description")
      SELECT 'llm_model', "value", 'Default model for assessment runs'
      FROM "app_settings" WHERE "key" = 'openai_default_model'
      ON CONFLICT ("key") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "app_settings" ("key", "value", "description") VALUES
        ('llm_provider', 'openai', 'openai | deepseek | openrouter | custom'),
        ('llm_base_url', '', 'Overrides the provider default; required for a custom provider'),
        ('llm_pricing', '', 'Optional per-model prices in USD per million tokens, as JSON')
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "app_settings" WHERE "key" IN ('llm_provider', 'llm_base_url', 'llm_pricing', 'llm_api_key', 'llm_model')`,
    );
  }
}
