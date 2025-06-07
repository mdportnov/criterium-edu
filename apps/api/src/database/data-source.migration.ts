import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

// Determine if we're running from compiled JS or TS
const isCompiled = __filename.endsWith('.js');
const migrationPath = isCompiled 
  ? path.join(__dirname, 'migrations/*.js')
  : path.join(__dirname, 'migrations/*.ts');

export const connectionOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'criterium',
  migrations: [migrationPath],
  synchronize: false,
  logging: true,
  migrationsTableName: 'migrations',
  migrationsRun: false,
};

export default new DataSource(connectionOptions);
