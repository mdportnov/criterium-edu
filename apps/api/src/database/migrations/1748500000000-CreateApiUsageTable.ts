import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateApiUsageTable1748500000000 implements MigrationInterface {
  name = 'CreateApiUsageTable1748500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'api_usage',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'taskId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'operationType',
            type: 'varchar',
          },
          {
            name: 'provider',
            type: 'varchar',
            default: "'openai'",
          },
          {
            name: 'model',
            type: 'varchar',
          },
          {
            name: 'promptTokens',
            type: 'integer',
            default: 0,
          },
          {
            name: 'completionTokens',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalTokens',
            type: 'integer',
            default: 0,
          },
          {
            name: 'costUsd',
            type: 'decimal',
            precision: 10,
            scale: 6,
            default: 0,
          },
          {
            name: 'requestDuration',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['taskId'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'IDX_api_usage_task_id',
            columnNames: ['taskId'],
          },
          {
            name: 'IDX_api_usage_user_id',
            columnNames: ['userId'],
          },
          {
            name: 'IDX_api_usage_created_at',
            columnNames: ['createdAt'],
          },
          {
            name: 'IDX_api_usage_operation_type',
            columnNames: ['operationType'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('api_usage');
  }
}