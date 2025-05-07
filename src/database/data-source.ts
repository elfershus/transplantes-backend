import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'organ_transplant',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  logging: process.env.NODE_ENV !== 'production',
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false',
        }
      : false,
});

export default dataSource;
