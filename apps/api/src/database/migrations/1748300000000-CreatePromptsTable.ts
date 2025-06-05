import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePromptsTable1748300000000 implements MigrationInterface {
  name = 'CreatePromptsTable1748300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'prompts',
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
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'promptType',
            type: 'enum',
            enum: ['system', 'user', 'assistant'],
            default: "'system'",
          },
          {
            name: 'defaultLanguage',
            type: 'varchar',
            length: '5',
            default: "'en'",
          },
          {
            name: 'variables',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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
        foreignKeys: [
          {
            columnNames: ['createdBy'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'prompt_translations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'promptId',
            type: 'uuid',
          },
          {
            name: 'languageCode',
            type: 'varchar',
            length: '5',
          },
          {
            name: 'content',
            type: 'text',
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
        foreignKeys: [
          {
            columnNames: ['promptId'],
            referencedTableName: 'prompts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'prompt_translations',
      new TableIndex({
        name: 'IDX_prompt_translations_prompt_language',
        columnNames: ['promptId', 'languageCode'],
      }),
    );

    // Insert default prompts
    await queryRunner.query(`
      INSERT INTO prompts (key, name, description, category, "promptType", "defaultLanguage", variables, "createdBy",
                           "isActive")
      SELECT 'task_solution_review_system'                        as key,
             'Task Solution Review System Prompt'                 as name,
             'System prompt for reviewing task solutions'         as description,
             'task_review'                                        as category,
             'system'                                             as "promptType",
             'en'                                                 as "defaultLanguage",
             'task_title,task_description,solution_code,criteria' as variables,
             id                                                   as "createdBy",
             true                                                 as "isActive"
      FROM users
      WHERE role = 'admin'
      LIMIT 1;
    `);

    await queryRunner.query(`
      INSERT INTO prompts (key, name, description, category, "promptType", "defaultLanguage", variables, "createdBy",
                           "isActive")
      SELECT 'solution_analysis_system'                   as key,
             'Solution Analysis System Prompt'            as name,
             'System prompt for analyzing code solutions' as description,
             'solution_analysis'                          as category,
             'system'                                     as "promptType",
             'en'                                         as "defaultLanguage",
             'solution_code,programming_language'         as variables,
             id                                           as "createdBy",
             true                                         as "isActive"
      FROM users
      WHERE role = 'admin'
      LIMIT 1;
    `);

    // Insert default translations
    await queryRunner.query(`
      INSERT INTO prompt_translations ("promptId", "languageCode", content)
      SELECT p.id,
             'en'                                                                                           as "languageCode",
             'You are an expert code reviewer. Analyze the submitted solution for the following task:
     
     Task: {{task_title}}
     Description: {{task_description}}
     
     Solution Code:
     {{solution_code}}
     
     Review Criteria:
     {{criteria}}
     
     Provide detailed feedback on code quality, correctness, and adherence to best practices.' as content
      FROM prompts p
      WHERE p.key = 'task_solution_review_system';
    `);

    await queryRunner.query(`
      INSERT INTO prompt_translations ("promptId", "languageCode", content)
      SELECT p.id,
             'ru'                                                                                                    as "languageCode",
             'Вы эксперт по ревью кода. Проанализируйте представленное решение для следующей задачи:
     
     Задача: {{task_title}}
     Описание: {{task_description}}
     
     Код решения:
     {{solution_code}}
     
     Критерии оценки:
     {{criteria}}
     
     Предоставьте детальную обратную связь по качеству кода, корректности и соблюдению лучших практик.' as content
      FROM prompts p
      WHERE p.key = 'task_solution_review_system';
    `);

    await queryRunner.query(`
      INSERT INTO prompt_translations ("promptId", "languageCode", content)
      SELECT p.id,
             'en'                                 as "languageCode",
             'Analyze the following {{programming_language}} code solution:
     
     {{solution_code}}
     
     Provide analysis on:
     1. Code structure and organization
     2. Performance considerations
     3. Potential bugs or issues
     4. Suggestions for improvement' as content
      FROM prompts p
      WHERE p.key = 'solution_analysis_system';
    `);

    await queryRunner.query(`
      INSERT INTO prompt_translations ("promptId", "languageCode", content)
      SELECT p.id,
             'ru'                              as "languageCode",
             'Проанализируйте следующее решение на {{programming_language}}:
     
     {{solution_code}}
     
     Предоставьте анализ по:
     1. Структура и организация кода
     2. Соображения производительности
     3. Потенциальные ошибки или проблемы
     4. Предложения по улучшению' as content
      FROM prompts p
      WHERE p.key = 'solution_analysis_system';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'prompt_translations',
      'IDX_prompt_translations_prompt_language',
    );
    await queryRunner.dropTable('prompt_translations');
    await queryRunner.dropTable('prompts');
  }
}
