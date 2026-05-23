import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  supabaseUrl: requiredEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  supabasePublishableKey: requiredEnv('SUPABASE_PUBLISHABLE_KEY'),
};
