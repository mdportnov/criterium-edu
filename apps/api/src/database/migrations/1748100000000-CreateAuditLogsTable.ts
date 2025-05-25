import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateAuditLogsTable1748100000000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1748100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'resource_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'status_code',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'request_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'response_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_AUDIT_LOGS_USER_ID', ['user_id']),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_AUDIT_LOGS_ACTION', ['action']),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_AUDIT_LOGS_RESOURCE', ['resource_type', 'resource_id']),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_AUDIT_LOGS_CREATED_AT', ['created_at']),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_AUDIT_LOGS_USER_CREATED', ['user_id', 'created_at']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}