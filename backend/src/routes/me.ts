import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { HttpError, sendError } from '../lib/http.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, async (request, response) => {
  try {
    const { user } = request as AuthenticatedRequest;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone, university_code, career, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, 'profile_fetch_failed', error.message);
    }

    if (profile) {
      return response.json({ profile });
    }

    const { data: createdProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        phone: null,
        university_code: null,
        career: null,
        role: 'customer',
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select('id, email, full_name, phone, university_code, career, role, avatar_url')
      .single();

    if (createError) {
      throw new HttpError(500, 'profile_create_failed', createError.message);
    }

    return response.json({ profile: createdProfile });
  } catch (error) {
    return sendError(response, error);
  }
});
