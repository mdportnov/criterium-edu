import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

// Simplified production check: DB_HOST must be explicitly set and not 'localhost'.
if (process.env.NODE_ENV === 'production') {
  const dbHost = process.env.DB_HOST;
  if (!dbHost || dbHost.toLowerCase() === 'localhost') {
    throw new Error(
      'PRODUCTION Critical Error: DB_HOST environment variable is missing or configured as "localhost". ' +
        'For production, DB_HOST must be explicitly set to the remote database server address.',
    );
  }
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'criterium_edu',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: process.env.NODE_ENV === 'development',
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
