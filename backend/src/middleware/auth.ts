import type { NextFunction, Request, Response } from 'express';
import type { User } from '@supabase/supabase-js';
import { HttpError } from '../lib/http.js';
import { supabaseAuth } from '../lib/supabase.js';

export type AuthenticatedRequest = Request & {
  user: User;
  accessToken: string;
};

const readBearerToken = (request: Request) => {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
};

export const getOptionalUser = async (request: Request) => {
  const accessToken = readBearerToken(request);

  if (!accessToken) {
    return { user: null, accessToken: null };
  }

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(401, 'invalid_token', 'La sesión no es válida.');
  }

  return { user: data.user, accessToken };
};

export const requireAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const { user, accessToken } = await getOptionalUser(request);

    if (!user || !accessToken) {
      throw new HttpError(401, 'auth_required', 'Debes iniciar sesión.');
    }

    (request as AuthenticatedRequest).user = user;
    (request as AuthenticatedRequest).accessToken = accessToken;
    next();
  } catch (error) {
    next(error);
  }
};
