import { supabase } from './supabase';

const defaultApiUrl = import.meta.env.PROD ? '' : 'http://localhost:4000';
const apiUrl = (import.meta.env.VITE_API_URL ?? defaultApiUrl).replace(/\/$/, '');

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean | 'optional';
};

const getAccessToken = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token ?? null;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (options.auth) {
    const token = await getAccessToken();

    if (!token && options.auth !== 'optional') {
      throw new Error('Debes iniciar sesión.');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'No se pudo completar la operación.');
  }

  return payload as T;
}
