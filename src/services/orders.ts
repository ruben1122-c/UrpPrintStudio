import { apiRequest } from '@/lib/api';
import type {
  CartCheckoutInput,
  CartCheckoutResult,
  CheckoutOrderInput,
  CheckoutOrderResult,
  UserOrder,
} from '@/types/database';

export async function createCheckoutOrder(payload: CheckoutOrderInput) {
  const { order } = await apiRequest<{ order: CheckoutOrderResult }>('/api/checkout', {
    method: 'POST',
    auth: 'optional',
    body: {
      productId: payload.product_id,
      templateId: payload.template_id ?? null,
      customerName: payload.customer_name,
      customerEmail: payload.customer_email,
      customerPhone: payload.customer_phone ?? null,
      customerCareer: payload.customer_career ?? null,
      graduationYear: payload.graduation_year ?? null,
      quantity: payload.quantity,
      deliveryMethod: payload.delivery_method ?? 'pickup',
      deliveryAmount: payload.delivery_amount ?? 0,
      deliveryAddress: payload.delivery_address ?? null,
      deliveryDistrict: payload.delivery_district ?? null,
      canvasData: payload.canvas_data ?? {},
      notes: payload.notes ?? null,
    },
  });

  return order;
}

export async function getMyOrders() {
  const { orders } = await apiRequest<{ orders: UserOrder[] }>('/api/orders', {
    auth: true,
  });

  return orders;
}

export async function createCartCheckout(payload: CartCheckoutInput) {
  const { order } = await apiRequest<{ order: CartCheckoutResult }>('/api/checkout/cart', {
    method: 'POST',
    auth: true,
    body: {
      customerName: payload.customer_name,
      customerEmail: payload.customer_email,
      customerPhone: payload.customer_phone ?? null,
      deliveryMethod: payload.delivery_method ?? 'pickup',
      deliveryAmount: payload.delivery_amount ?? 0,
      deliveryAddress: payload.delivery_address ?? null,
      deliveryDistrict: payload.delivery_district ?? null,
      notes: payload.notes ?? null,
      items: payload.items.map((item) => ({
        productId: item.product_id,
        templateId: item.template_id ?? null,
        quantity: item.quantity,
        customerCareer: item.customer_career ?? null,
        graduationYear: item.graduation_year ?? null,
        canvasData: item.canvas_data ?? {},
        productionNotes: item.production_notes ?? null,
      })),
    },
  });

  return order;
}
