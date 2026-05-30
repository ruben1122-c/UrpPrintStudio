import { Router } from 'express';
import { HttpError, isValidEmail, optionalString, requireString, sendError } from '../lib/http.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const authRouter = Router();

authRouter.post('/signup', async (request, response) => {
  try {
    const fullName = requireString(request.body.fullName, 'fullName');
    const email = requireString(request.body.email, 'email').toLowerCase();
    const password = requireString(request.body.password, 'password');
    const phone = optionalString(request.body.phone);
    const universityCode = optionalString(request.body.universityCode);
    const career = optionalString(request.body.career);

    if (!isValidEmail(email)) {
      throw new HttpError(400, 'invalid_email', 'Ingresa un correo válido.');
    }

    if (password.length < 8) {
      throw new HttpError(400, 'weak_password', 'La contraseña debe tener al menos 8 caracteres.');
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      const status = createError.message.toLowerCase().includes('already') ? 409 : 400;
      throw new HttpError(status, 'signup_failed', createError.message);
    }

    const user = createdUser.user;

    if (!user) {
      throw new HttpError(500, 'signup_failed', 'Supabase no devolvió el usuario creado.');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email,
        full_name: fullName,
        phone,
        university_code: universityCode,
        career,
        role: 'customer',
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .select('id, email, full_name, phone, university_code, career, role, avatar_url')
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id).catch((cleanupError) => {
        console.error('Signup cleanup failed', cleanupError);
      });
      throw new HttpError(500, 'profile_create_failed', profileError.message);
    }

    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    });
  } catch (error) {
    return sendError(response, error);
  }
});
