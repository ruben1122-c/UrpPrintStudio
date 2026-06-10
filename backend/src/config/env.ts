import dotenv from 'dotenv';

dotenv.config();

const PLACEHOLDER_PATTERNS = ['your_', '_here', 'project-ref'];

const requiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern))) {
    throw new Error(`Invalid environment variable: ${key} still contains a placeholder value.`);
  }

  return value;
};

const requiredSupabaseUrl = () => {
  const value = requiredEnv('SUPABASE_URL');

  try {
    const url = new URL(value);

    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) {
      throw new Error();
    }
  } catch {
    throw new Error('Invalid environment variable: SUPABASE_URL must be a Supabase project URL.');
  }

  return value;
};

const requiredSupabasePublishableKey = () => {
  const value = requiredEnv('SUPABASE_PUBLISHABLE_KEY');

  if (!value.startsWith('sb_publishable_') && !value.startsWith('eyJ')) {
    throw new Error(
      'Invalid environment variable: SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable/anon key.',
    );
  }

  assertJwtRole(value, 'anon', 'SUPABASE_PUBLISHABLE_KEY');

  return value;
};

const requiredSupabaseServiceRoleKey = (publishableKey: string) => {
  const value = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (value === publishableKey || value.startsWith('sb_publishable_')) {
    throw new Error(
      'Invalid environment variable: SUPABASE_SERVICE_ROLE_KEY must be the Supabase service role/secret key, not the publishable key.',
    );
  }

  if (!value.startsWith('sb_secret_') && !value.startsWith('eyJ')) {
    throw new Error(
      'Invalid environment variable: SUPABASE_SERVICE_ROLE_KEY must be a Supabase service role/secret key.',
    );
  }

  assertJwtRole(value, 'service_role', 'SUPABASE_SERVICE_ROLE_KEY');

  return value;
};

const assertJwtRole = (value: string, expectedRole: string, key: string) => {
  if (!value.startsWith('eyJ')) {
    return;
  }

  try {
    const [, payload] = value.split('.');
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;

    if (!parsed || typeof parsed !== 'object' || !('role' in parsed)) {
      throw new Error();
    }

    if (parsed.role !== expectedRole) {
      throw new Error();
    }
  } catch {
    throw new Error(`Invalid environment variable: ${key} must have the Supabase ${expectedRole} role.`);
  }
};

const supabasePublishableKey = requiredSupabasePublishableKey();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  supabaseUrl: requiredSupabaseUrl(),
  supabaseServiceRoleKey: requiredSupabaseServiceRoleKey(supabasePublishableKey),
  supabasePublishableKey,
};
