import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOperationTimeoutFields1748400000000 implements MigrationInterface {
  name = 'AddOperationTimeoutFields1748400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add failedItems column
    await queryRunner.addColumn(
      'processing_operations',
      new TableColumn({
        name: 'failedItems',
        type: 'int',
        default: 0,
      })
    );

    // Add lastProgressUpdate column
    await queryRunner.addColumn(
      'processing_operations',
      new TableColumn({
        name: 'lastProgressUpdate',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add timeoutMinutes column
    await queryRunner.addColumn(
      'processing_operations',
      new TableColumn({
        name: 'timeoutMinutes',
        type: 'int',
        default: 30,
      })
    );

    // Update existing operations to set lastProgressUpdate for in-progress ones
    await queryRunner.query(`
      UPDATE processing_operations 
      SET "lastProgressUpdate" = "updatedAt" 
      WHERE status IN ('in_progress', 'pending')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('processing_operations', 'timeoutMinutes');
    await queryRunner.dropColumn('processing_operations', 'lastProgressUpdate');
    await queryRunner.dropColumn('processing_operations', 'failedItems');
  }
}