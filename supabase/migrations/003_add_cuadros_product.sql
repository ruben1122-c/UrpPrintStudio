-- Add framed custom prints to the public catalog without changing API contracts.

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
  'Cuadro personalizado',
  'cuadros',
  'Cuadro decorativo personalizado para egresados, alumnos o promociones URP.',
  45.00,
  0.00,
  null,
  4,
  true
from public.product_categories c
where c.slug = 'papeleria'
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

update public.products
set sort_order = 5
where slug = 'pines-urp';

update public.products
set sort_order = 6
where slug = 'tote-bags';

update public.products
set sort_order = 7
where slug = 'stickers';

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
  'Cuadro Personalizado URP',
  'cuadro-personalizado-urp',
  'Diseno enmarcado academico para egresados, alumnos o promociones URP.',
  1200,
  1600,
  '{"fields":["customer_name","customer_career","graduation_year"],"theme":"academic-frame","options":["frame_type","frame_size","frame_color"]}'::jsonb,
  1,
  true
from public.products p
where p.slug = 'cuadros'
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
