import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const connectionOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'criterium',
  entities: [__dirname + '/../**/*.entity.js'],
  synchronize: false,
  logging: true,
};

export default new DataSource(connectionOptions);
