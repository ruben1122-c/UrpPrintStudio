import type { Session } from '@supabase/supabase-js';
import { apiRequest } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { profile } = await apiRequest<{ profile: Profile }>('/api/auth/signup', {
    method: 'POST',
    body: {
      email,
      password,
      fullName,
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    needsEmailConfirmation: false,
    profile,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getMyProfile() {
  const { profile } = await apiRequest<{ profile: Profile }>('/api/me', {
    auth: true,
  });

  return profile;
}
