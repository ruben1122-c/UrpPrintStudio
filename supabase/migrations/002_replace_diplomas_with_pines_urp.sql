-- Replace the public catalog diploma item with URP pins without deleting
-- historical records that may already be referenced by orders or designs.

update public.templates
set active = false
where slug = 'diploma-conmemorativo-urp';

update public.products
set active = false
where slug = 'diplomas';

insert into public.products (
  category_id,
  name,
  slug,
  description,
  base_price,
  digital_download_price,
  image_url,
  sort_order,
  active
)
select
  c.id,
  'Pines URP',
  'pines-urp',
  'Pines personalizados con identidad URP.',
  12.00,
  0.00,
  'https://images.unsplash.com/photo-1614111662625-a024f2759e19',
  4,
  true
from public.product_categories c
where c.slug = 'accesorios'
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  digital_download_price = excluded.digital_download_price,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  active = true;

insert into public.templates (
  product_id,
  name,
  slug,
  description,
  canvas_width,
  canvas_height,
  config,
  sort_order,
  active
)
select
  p.id,
  'Pin URP Personal',
  'pin-urp-personal',
  'Diseno circular para pin con nombre, carrera y ano.',
  1000,
  1000,
  '{"fields":["customer_name","customer_career","graduation_year"],"theme":"badge"}'::jsonb,
  1,
  true
from public.products p
where p.slug = 'pines-urp'
on conflict (slug) do update
set
  product_id = excluded.product_id,
  name = excluded.name,
  description = excluded.description,
  canvas_width = excluded.canvas_width,
  canvas_height = excluded.canvas_height,
  config = excluded.config,
  sort_order = excluded.sort_order,
  active = true;
