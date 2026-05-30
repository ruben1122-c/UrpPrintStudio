import { supabase } from '@/lib/supabase';
import type { Product, Template } from '@/types/database';

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, base_price, digital_download_price, currency, image_url, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Product[];
}

export async function getFirstActiveProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, base_price, digital_download_price, currency, image_url, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Product | null;
}

export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, base_price, digital_download_price, currency, image_url, active, sort_order')
    .eq('id', productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Product | null;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, base_price, digital_download_price, currency, image_url, active, sort_order')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Product | null;
}

export async function getFirstTemplateForProduct(productId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('id, product_id, name, slug, canvas_width, canvas_height, config, active, sort_order')
    .eq('product_id', productId)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Template | null;
}
