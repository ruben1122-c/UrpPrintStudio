import { Router } from 'express';
import { HttpError, sendError } from '../lib/http.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const ordersRouter = Router();

ordersRouter.get('/', requireAuth, async (request, response) => {
  try {
    const { user } = request as AuthenticatedRequest;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_code, status, payment_status, total_amount, customer_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpError(500, 'orders_fetch_failed', error.message);
    }

    return response.json({
      orders: (data ?? []).map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
      })),
    });
  } catch (error) {
    return sendError(response, error);
  }
});
