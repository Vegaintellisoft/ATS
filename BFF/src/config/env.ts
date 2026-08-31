import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'ats-dev-secret-key-998877',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
};
