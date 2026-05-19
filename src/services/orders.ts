import { supabase } from '@/lib/supabase';
import type { CheckoutOrderInput, CheckoutOrderResult, UserOrder } from '@/types/database';

type CheckoutOrderRpcRow = {
  order_id: string;
  order_code: string;
  design_id: string;
  total_amount: number | string;
};

export async function createCheckoutOrder(payload: CheckoutOrderInput) {
  const { data, error } = await supabase.rpc('create_checkout_order', {
    p_product_id: payload.product_id,
    p_template_id: payload.template_id ?? null,
    p_customer_name: payload.customer_name,
    p_customer_email: payload.customer_email,
    p_customer_phone: payload.customer_phone ?? null,
    p_customer_career: payload.customer_career ?? null,
    p_graduation_year: payload.graduation_year ?? null,
    p_quantity: payload.quantity,
    p_delivery_method: payload.delivery_method ?? 'pickup',
    p_delivery_amount: payload.delivery_amount ?? 0,
    p_delivery_address: payload.delivery_address ?? null,
    p_delivery_district: payload.delivery_district ?? null,
    p_canvas_data: payload.canvas_data ?? {},
    p_notes: payload.notes ?? null,
  });

  if (error) {
    throw error;
  }

  const result = Array.isArray(data) ? data[0] as CheckoutOrderRpcRow | undefined : null;

  if (!result) {
    throw new Error('Supabase no devolvió el pedido creado.');
  }

  return {
    order_id: result.order_id,
    order_code: result.order_code,
    design_id: result.design_id,
    total_amount: Number(result.total_amount),
  } satisfies CheckoutOrderResult;
}

export async function getMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_code, status, payment_status, total_amount, customer_name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((order) => ({
    ...order,
    total_amount: Number(order.total_amount),
  })) as UserOrder[];
}
