import * as path from 'path';
import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

// Standalone entry points (typeorm CLI, migration runner) get no Nest
// ConfigModule, so the .env files are loaded here as well. Values already
// present in process.env win, which is what container environments rely on.
loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const isCompiled = __filename.endsWith('.js');
const extension = isCompiled ? 'js' : 'ts';

const asBoolean = (value: string | undefined): boolean =>
  ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase());

export const connectionOptions: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'criterium',
  entities: [path.join(__dirname, `/../**/*.entity.${extension}`)],
  migrations: [path.join(__dirname, `/migrations/*.${extension}`)],
  migrationsTableName: 'migrations',
  migrationsRun: false,
  // Schema changes only ever come from migrations, in every environment.
  synchronize: false,
  logging: asBoolean(process.env.DB_LOGGING),
};

export default new DataSource(connectionOptions);
