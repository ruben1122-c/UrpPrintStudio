import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

interface EnvSource {
  file: string;
  exists: boolean;
  keys: Set<string>;
}

interface KeyAnalysis {
  name: string;
  present: boolean;
  fingerprint?: string;
  kind?: string;
  role?: string;
  issues: string[];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local'];
const REQUIRED_BACKEND_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;
const FRONTEND_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_URL',
] as const;

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

function statusLine(ok: boolean, message: string) {
  console.log(`${ok ? '✅' : '❌'} ${message}`);
}

function warningLine(message: string) {
  console.log(`⚠️  ${message}`);
}

function maskSecret(value: string) {
  const hash = createHash('sha256').update(value).digest('hex').slice(0, 10);
  const start = value.slice(0, 8);
  const end = value.slice(-4);

  return `${start}…${end} (len=${value.length}, sha256=${hash})`;
}

function decodeJwtPayload(value: string): Record<string, unknown> | null {
  const [, payload] = value.split('.');

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function analyzeKey(name: string, value: string | undefined): KeyAnalysis {
  const issues: string[] = [];

  if (!value) {
    return { name, present: false, issues: [`${name} is missing`] };
  }

  const trimmed = value.trim();
  let kind = 'unknown';
  let role: string | undefined;

  if (trimmed !== value) {
    issues.push(`${name} has leading or trailing whitespace`);
  }

  if (trimmed.startsWith('sb_publishable_')) {
    kind = 'supabase publishable key';
    role = 'publishable';
  } else if (trimmed.startsWith('sb_secret_')) {
    kind = 'supabase secret key';
    role = 'service_role';
  } else if (trimmed.startsWith('eyJ')) {
    kind = 'legacy jwt key';
    const payload = decodeJwtPayload(trimmed);
    const jwtRole = payload?.role;

    if (typeof jwtRole === 'string') {
      role = jwtRole;
    } else {
      issues.push(`${name} looks like a JWT, but no role claim was found`);
    }
  } else {
    issues.push(`${name} does not look like a Supabase publishable, secret, or legacy JWT key`);
  }

  return {
    name,
    present: true,
    fingerprint: maskSecret(trimmed),
    kind,
    role,
    issues,
  };
}

function printKeyAnalysis(analysis: KeyAnalysis) {
  if (!analysis.present) {
    statusLine(false, analysis.issues[0]);
    return;
  }

  statusLine(true, `${analysis.name}: ${analysis.fingerprint}`);
  console.log(`   kind: ${analysis.kind ?? 'unknown'}${analysis.role ? `, role: ${analysis.role}` : ''}`);

  for (const issue of analysis.issues) {
    warningLine(issue);
  }
}

function getProjectRef(url: string | undefined) {
  if (!url) {
    return null;
  }

  try {
    const { hostname } = new URL(url);
    const [projectRef] = hostname.split('.');

    if (!hostname.endsWith('.supabase.co') || !projectRef) {
      return null;
    }

    return projectRef;
  } catch {
    return null;
  }
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readEnvSources(): Promise<EnvSource[]> {
  const sources: EnvSource[] = [];

  for (const file of ENV_FILES) {
    const absolutePath = path.join(projectRoot, file);
    const exists = await fileExists(absolutePath);
    const keys = new Set<string>();

    if (exists) {
      const contents = await readFile(absolutePath, 'utf8');
      const parsed = dotenv.parse(contents);

      for (const key of Object.keys(parsed)) {
        keys.add(key);
      }
    }

    sources.push({ file, exists, keys });
  }

  return sources;
}

function loadBackendEnv() {
  const envPath = path.join(projectRoot, '.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    warningLine(`Could not load ${envPath}: ${result.error.message}`);
  }
}

function printEnvSources(sources: EnvSource[]) {
  for (const source of sources) {
    statusLine(source.exists, `${source.file} ${source.exists ? 'found' : 'not found'}`);

    if (!source.exists) {
      continue;
    }

    const relevantKeys = [...REQUIRED_BACKEND_KEYS, ...FRONTEND_KEYS].filter((key) => source.keys.has(key));
    console.log(`   relevant keys: ${relevantKeys.length > 0 ? relevantKeys.join(', ') : '(none)'}`);
  }
}

async function testSupabaseAdmin(url: string | undefined, serviceRoleKey: string | undefined) {
  section('Backend service role API test');

  if (!url || !serviceRoleKey) {
    statusLine(false, 'Skipping admin test because SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
    return false;
  }

  const client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    statusLine(false, `Supabase Admin rejected the service role key: ${error.message}`);
    console.log(`   status: ${error.status ?? 'unknown'}, name: ${error.name}`);
    return false;
  }

  statusLine(true, 'Supabase Admin accepted SUPABASE_SERVICE_ROLE_KEY');
  return true;
}

async function testPublishableKey(url: string | undefined, publishableKey: string | undefined) {
  section('Frontend publishable API test');

  if (!url || !publishableKey) {
    statusLine(false, 'Skipping publishable test because URL or publishable/anon key is missing');
    return false;
  }

  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: {
      apikey: publishableKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    statusLine(false, `Supabase Auth rejected the publishable key: HTTP ${response.status}`);
    console.log(`   response: ${body.slice(0, 240) || '(empty)'}`);
    return false;
  }

  statusLine(true, 'Supabase Auth accepted the publishable key');
  return true;
}

async function main() {
  console.log('Signup/Supabase debug script');
  console.log(`Project root: ${projectRoot}`);
  console.log('Secrets are masked. Full API keys are never printed.');

  const sources = await readEnvSources();

  section('Environment files');
  printEnvSources(sources);

  section('Backend dotenv load');
  console.log('The backend currently calls dotenv.config(), so this script loads only the root .env file for backend parity.');
  loadBackendEnv();

  const backendUrl = process.env.SUPABASE_URL;
  const frontendUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const backendPublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const frontendPublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const publishableKey = backendPublishableKey ?? frontendPublishableKey;

  section('URL checks');
  const backendProjectRef = getProjectRef(backendUrl);
  const frontendProjectRef = getProjectRef(frontendUrl);

  statusLine(Boolean(backendUrl), `SUPABASE_URL ${backendUrl ? `= ${backendUrl}` : 'is missing'}`);
  statusLine(Boolean(backendProjectRef), `SUPABASE_URL project ref: ${backendProjectRef ?? 'invalid or not a *.supabase.co URL'}`);

  if (frontendUrl) {
    statusLine(Boolean(frontendProjectRef), `VITE_SUPABASE_URL project ref: ${frontendProjectRef ?? 'invalid or not a *.supabase.co URL'}`);
  } else {
    warningLine('VITE_SUPABASE_URL is missing; the browser client will fail unless Vite receives it another way');
  }

  if (backendProjectRef && frontendProjectRef && backendProjectRef !== frontendProjectRef) {
    statusLine(false, 'Backend and frontend Supabase URLs point to different projects');
  }

  section('Key checks');
  const serviceAnalysis = analyzeKey('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey);
  const backendPublishableAnalysis = analyzeKey('SUPABASE_PUBLISHABLE_KEY', backendPublishableKey);
  const frontendPublishableAnalysis = analyzeKey('VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY', frontendPublishableKey);

  printKeyAnalysis(serviceAnalysis);
  printKeyAnalysis(backendPublishableAnalysis);
  printKeyAnalysis(frontendPublishableAnalysis);

  if (serviceRoleKey && publishableKey && serviceRoleKey.trim() === publishableKey.trim()) {
    statusLine(false, 'SUPABASE_SERVICE_ROLE_KEY is identical to the publishable/anon key. This will break admin signup.');
  }

  if (serviceAnalysis.role && serviceAnalysis.role !== 'service_role') {
    statusLine(false, `SUPABASE_SERVICE_ROLE_KEY role is "${serviceAnalysis.role}", expected "service_role" or an sb_secret_* key`);
  }

  const adminOk = await testSupabaseAdmin(backendUrl, serviceRoleKey);
  const publishableOk = await testPublishableKey(frontendUrl ?? backendUrl, frontendPublishableKey ?? backendPublishableKey);

  section('Diagnosis');

  if (!adminOk) {
    statusLine(false, 'Most likely signup failure: backend SUPABASE_SERVICE_ROLE_KEY is missing, malformed, from the wrong project, or not the real service role/secret key.');
    console.log('Fix: copy the Service Role / Secret key from Supabase Project Settings > API into SUPABASE_SERVICE_ROLE_KEY in root .env, then restart npm run dev:backend.');
  }

  if (adminOk && !publishableOk) {
    statusLine(false, 'Backend signup may work, but the browser auto-login can still show Invalid API key because the Vite publishable key is wrong.');
    console.log('Fix: copy the Publishable / anon key into VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY, then restart npm run dev.');
  }

  if (adminOk && publishableOk) {
    statusLine(true, 'Supabase keys look valid. If signup still fails, inspect the backend /api/auth/signup response and Supabase Auth settings next.');
  }

  if (!adminOk || !publishableOk) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  section('Unexpected script error');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
