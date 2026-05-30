export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  digital_download_price: number;
  currency: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

export type Template = {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  canvas_width: number;
  canvas_height: number;
  config: Record<string, unknown>;
  active: boolean;
  sort_order: number;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  university_code: string | null;
  career: string | null;
  role: 'customer' | 'admin' | 'print_partner';
  avatar_url: string | null;
};

export type CheckoutOrderInput = {
  product_id: string;
  template_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_career?: string | null;
  graduation_year?: number | null;
  quantity: number;
  delivery_method?: 'pickup' | 'delivery' | 'digital';
  delivery_amount?: number;
  delivery_address?: string | null;
  delivery_district?: string | null;
  canvas_data?: Record<string, unknown>;
  notes?: string | null;
};

export type CheckoutOrderResult = {
  order_id: string;
  design_id: string;
  order_code: string;
  total_amount: number;
};

export type UserOrder = {
  id: string;
  order_code: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'not_required' | 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  customer_name: string;
  created_at: string;
};
