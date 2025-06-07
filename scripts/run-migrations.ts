#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'criterium',
    migrations: [path.join(__dirname, '../apps/api/src/database/migrations/*.ts')],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Data source initialized');
    
    const pendingMigrations = await dataSource.showMigrations();
    console.log('Pending migrations:', pendingMigrations);
    
    if (pendingMigrations) {
      console.log('Running migrations...');
      await dataSource.runMigrations();
      console.log('Migrations completed successfully');
    } else {
      console.log('No pending migrations');
    }
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
