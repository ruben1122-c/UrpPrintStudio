import { Router } from 'express';
import { HttpError, isValidEmail, optionalString, requireString, sendError } from '../lib/http.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const contactRouter = Router();

contactRouter.post('/', async (request, response) => {
  try {
    const fullName = requireString(request.body.fullName, 'fullName');
    const email = requireString(request.body.email, 'email').toLowerCase();
    const phone = optionalString(request.body.phone);
    const subject = optionalString(request.body.subject);
    const message = requireString(request.body.message, 'message');

    if (!isValidEmail(email)) {
      throw new HttpError(400, 'invalid_email', 'Ingresa un correo válido.');
    }

    const { error } = await supabaseAdmin.from('contact_messages').insert({
      full_name: fullName,
      email,
      phone,
      subject,
      message,
    });

    if (error) {
      throw new HttpError(500, 'contact_create_failed', error.message);
    }

    return response.status(201).json({ ok: true });
  } catch (error) {
    return sendError(response, error);
  }
});
