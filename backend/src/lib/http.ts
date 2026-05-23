import type { Response } from 'express';

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const sendError = (response: Response, error: unknown) => {
  if (error instanceof HttpError) {
    return response.status(error.status).json({
      error: error.code,
      message: error.message,
    });
  }

  console.error(error);

  return response.status(500).json({
    error: 'internal_server_error',
    message: 'No se pudo completar la operación.',
  });
};

export const requireString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'invalid_payload', `El campo ${field} es obligatorio.`);
  }

  return value.trim();
};

export const optionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const isValidEmail = (value: string) => value.includes('@') && value.indexOf('@') > 0;
