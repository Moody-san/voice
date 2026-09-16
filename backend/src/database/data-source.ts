import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Standalone DataSource for the TypeORM CLI (migration generate/run/revert).
 * The running app configures TypeORM via DatabaseModule; this mirrors the same
 * connection for schema tooling.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [`${__dirname}/entities/**.entity.{js,ts}`],
  migrations: [`${__dirname}/migrations/**/!(*.spec).{js,ts}`],
  migrationsTableName: 'migrations',
});
