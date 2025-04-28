export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'organ_transplant',
    ssl: process.env.DATABASE_SSL === 'true',
    sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },
  environment: process.env.NODE_ENV || 'development',
});
