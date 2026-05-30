-- URP PrintStudio database schema
-- Target: Supabase PostgreSQL
-- Strategy: clean reset for development/MVP environments.
-- Run from the Supabase SQL Editor before connecting the frontend keys.

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('customer', 'admin', 'print_partner');
  end if;

  if not exists (select 1 from pg_type where typname = 'design_status') then
    create type public.design_status as enum ('draft', 'saved', 'exported', 'ordered');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'confirmed',
      'in_production',
      'ready',
      'delivered',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'not_required',
      'pending',
      'paid',
      'failed',
      'refunded'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum (
      'none',
      'cash',
      'transfer',
      'yape',
      'plin',
      'mercadopago',
      'izipay'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_method') then
    create type public.delivery_method as enum ('pickup', 'delivery', 'digital');
  end if;

  if not exists (select 1 from pg_type where typname = 'asset_type') then
    create type public.asset_type as enum (
      'source_photo',
      'template_background',
      'preview_image',
      'export_png',
      'export_pdf',
      'payment_receipt'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  university_code text,
  career text,
  role public.app_role not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_format check (position('@' in email) > 1)
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null,
  base_price numeric(10, 2) not null default 0,
  digital_download_price numeric(10, 2) not null default 0,
  currency char(3) not null default 'PEN',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_base_price_non_negative check (base_price >= 0),
  constraint products_download_price_non_negative check (digital_download_price >= 0),
  constraint products_currency_uppercase check (currency = upper(currency))
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  canvas_width integer not null default 1200,
  canvas_height integer not null default 1600,
  background_url text,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_canvas_positive check (canvas_width > 0 and canvas_height > 0)
);

create table if not exists public.print_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  district text,
  commission_rate numeric(5, 2) not null default 15.00,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint print_partners_commission_range check (commission_rate >= 0 and commission_rate <= 100),
  constraint print_partners_email_format check (email is null or position('@' in email) > 1)
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  template_id uuid references public.templates(id) on delete set null,
  status public.design_status not null default 'draft',
  guest_email text,
  customer_name text not null,
  customer_career text,
  graduation_year integer,
  source_photo_url text,
  preview_image_url text,
  export_png_url text,
  export_pdf_url text,
  canvas_data jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint designs_owner_or_guest check (user_id is not null or guest_email is not null),
  constraint designs_guest_email_format check (guest_email is null or position('@' in guest_email) > 1),
  constraint designs_graduation_year_range check (
    graduation_year is null or graduation_year between 1900 and 2100
  )
);

create table if not exists public.design_assets (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  asset_type public.asset_type not null,
  bucket_name text not null default 'design-assets',
  storage_path text not null,
  public_url text,
  mime_type text,
  file_size_bytes bigint,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  constraint design_assets_storage_path_unique unique (bucket_name, storage_path),
  constraint design_assets_size_positive check (file_size_bytes is null or file_size_bytes > 0),
  constraint design_assets_dimensions_positive check (
    (width is null or width > 0) and (height is null or height > 0)
  )
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  print_partner_id uuid references public.print_partners(id) on delete set null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_method public.payment_method not null default 'none',
  delivery_method public.delivery_method not null default 'pickup',
  subtotal numeric(10, 2) not null default 0,
  commission_amount numeric(10, 2) not null default 0,
  delivery_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) generated always as (
    subtotal + commission_amount + delivery_amount
  ) stored,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  delivery_address text,
  delivery_district text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amounts_non_negative check (
    subtotal >= 0 and commission_amount >= 0 and delivery_amount >= 0
  ),
  constraint orders_customer_email_format check (position('@' in customer_email) > 1)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  design_id uuid not null references public.designs(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  template_id uuid references public.templates(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) generated always as (quantity * unit_price) stored,
  production_notes text,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_unit_price_non_negative check (unit_price >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount numeric(10, 2) not null,
  provider_reference text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0)
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_email_format check (position('@' in email) > 1)
);

-- ---------------------------------------------------------------------------
-- Utility functions
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_print_partner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'print_partner')
  );
$$;

create or replace function public.create_my_profile(
  p_full_name text default null,
  p_phone text default null,
  p_university_code text default null,
  p_career text default null,
  p_avatar_url text default null
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  university_code text,
  career text,
  role public.app_role,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
begin
  if current_user_id is null then
    raise exception 'auth_required';
  end if;

  current_email := coalesce(
    auth.jwt()->>'email',
    (select u.email from auth.users u where u.id = current_user_id)
  );

  if current_email is null or position('@' in current_email) <= 1 then
    raise exception 'auth_email_required';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    university_code,
    career,
    role,
    avatar_url
  )
  values (
    current_user_id,
    current_email,
    nullif(trim(coalesce(p_full_name, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_university_code, '')), ''),
    nullif(trim(coalesce(p_career, '')), ''),
    'customer',
    nullif(trim(coalesce(p_avatar_url, '')), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    university_code = coalesce(excluded.university_code, public.profiles.university_code),
    career = coalesce(excluded.career, public.profiles.career),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.university_code,
    p.career,
    p.role,
    p.avatar_url
  from public.profiles p
  where p.id = current_user_id;
end;
$$;

create or replace function public.backfill_profiles_from_auth()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    u.raw_user_meta_data->>'avatar_url'
  from auth.users u
  where u.email is not null
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

create or replace function public.generate_order_code()
returns text
language plpgsql
as $$
declare
  next_code text;
begin
  loop
    next_code := 'URP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (
      select 1
      from public.orders
      where order_code = next_code
    );
  end loop;

  return next_code;
end;
$$;

create or replace function public.refresh_order_totals(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_subtotal numeric(10, 2);
  next_commission_rate numeric(5, 2);
begin
  select coalesce(sum(line_total), 0)
  into next_subtotal
  from public.order_items
  where order_id = target_order_id;

  select coalesce(pp.commission_rate, 0)
  into next_commission_rate
  from public.orders o
  left join public.print_partners pp on pp.id = o.print_partner_id
  where o.id = target_order_id;

  update public.orders
  set
    subtotal = next_subtotal,
    commission_amount = round(next_subtotal * coalesce(next_commission_rate, 0) / 100, 2),
    updated_at = now()
  where id = target_order_id;
end;
$$;

create or replace function public.create_checkout_order(
  p_product_id uuid,
  p_template_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text default null,
  p_customer_career text default null,
  p_graduation_year integer default null,
  p_quantity integer default 1,
  p_delivery_method public.delivery_method default 'pickup',
  p_delivery_amount numeric default 0,
  p_delivery_address text default null,
  p_delivery_district text default null,
  p_canvas_data jsonb default '{}'::jsonb,
  p_notes text default null
)
returns table (
  order_id uuid,
  order_code text,
  design_id uuid,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  next_design_id uuid;
  next_order_id uuid;
  next_order_code text;
  selected_product public.products%rowtype;
  selected_template_id uuid;
  clean_quantity integer;
  clean_delivery_amount numeric(10, 2);
  next_subtotal numeric(10, 2);
begin
  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'customer_name_required';
  end if;

  if p_customer_email is null or position('@' in p_customer_email) <= 1 then
    raise exception 'valid_customer_email_required';
  end if;

  if p_graduation_year is not null and (p_graduation_year < 1900 or p_graduation_year > 2100) then
    raise exception 'graduation_year_out_of_range';
  end if;

  clean_quantity := greatest(coalesce(p_quantity, 1), 1);
  clean_delivery_amount := greatest(coalesce(p_delivery_amount, 0), 0);

  select *
  into selected_product
  from public.products
  where id = p_product_id
    and active = true;

  if selected_product.id is null then
    raise exception 'active_product_not_found';
  end if;

  if p_template_id is not null then
    select id
    into selected_template_id
    from public.templates
    where id = p_template_id
      and product_id = p_product_id
      and active = true;

    if selected_template_id is null then
      raise exception 'active_template_not_found_for_product';
    end if;
  else
    select id
    into selected_template_id
    from public.templates
    where product_id = p_product_id
      and active = true
    order by sort_order asc, created_at asc
    limit 1;
  end if;

  next_design_id := gen_random_uuid();
  next_order_id := gen_random_uuid();
  next_order_code := public.generate_order_code();
  next_subtotal := round(selected_product.base_price * clean_quantity, 2);

  insert into public.designs (
    id,
    user_id,
    product_id,
    template_id,
    status,
    guest_email,
    customer_name,
    customer_career,
    graduation_year,
    canvas_data
  )
  values (
    next_design_id,
    current_user_id,
    selected_product.id,
    selected_template_id,
    'ordered',
    case when current_user_id is null then trim(p_customer_email) else null end,
    trim(p_customer_name),
    nullif(trim(coalesce(p_customer_career, '')), ''),
    p_graduation_year,
    coalesce(p_canvas_data, '{}'::jsonb)
  );

  insert into public.orders (
    id,
    order_code,
    user_id,
    status,
    payment_status,
    payment_method,
    delivery_method,
    subtotal,
    commission_amount,
    delivery_amount,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_district,
    notes
  )
  values (
    next_order_id,
    next_order_code,
    current_user_id,
    'pending',
    'pending',
    'none',
    coalesce(p_delivery_method, 'pickup'),
    next_subtotal,
    0,
    clean_delivery_amount,
    trim(p_customer_name),
    trim(p_customer_email),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    nullif(trim(coalesce(p_delivery_address, '')), ''),
    nullif(trim(coalesce(p_delivery_district, '')), ''),
    nullif(trim(coalesce(p_notes, '')), '')
  );

  insert into public.order_items (
    order_id,
    design_id,
    product_id,
    template_id,
    quantity,
    unit_price
  )
  values (
    next_order_id,
    next_design_id,
    selected_product.id,
    selected_template_id,
    clean_quantity,
    selected_product.base_price
  );

  insert into public.order_status_history (order_id, old_status, new_status, changed_by, note)
  values (next_order_id, null, 'pending', current_user_id, 'Pedido creado desde checkout.');

  return query
  select
    o.id,
    o.order_code,
    next_design_id,
    o.total_amount
  from public.orders o
  where o.id = next_order_id;
end;
$$;

grant execute on function public.create_checkout_order(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  public.delivery_method,
  numeric,
  text,
  text,
  jsonb,
  text
) to anon, authenticated;

grant execute on function public.create_my_profile(
  text,
  text,
  text,
  text,
  text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists prevent_profile_role_escalation on public.profiles;
drop function if exists public.prevent_profile_role_escalation();

drop trigger if exists set_product_categories_updated_at on public.product_categories;
create trigger set_product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists set_print_partners_updated_at on public.print_partners;
create trigger set_print_partners_updated_at
before update on public.print_partners
for each row execute function public.set_updated_at();

drop trigger if exists set_designs_updated_at on public.designs;
create trigger set_designs_updated_at
before update on public.designs
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

drop trigger if exists log_order_status_change on public.orders;
drop trigger if exists sync_order_totals_from_items on public.order_items;
drop trigger if exists mark_design_as_ordered on public.order_items;
drop function if exists public.log_order_status_change();
drop function if exists public.sync_order_totals_from_items();
drop function if exists public.mark_design_as_ordered();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_product_categories_active_sort on public.product_categories(active, sort_order);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_active_sort on public.products(active, sort_order);
create index if not exists idx_templates_product_id on public.templates(product_id);
create index if not exists idx_templates_active_sort on public.templates(active, sort_order);
create index if not exists idx_designs_user_id on public.designs(user_id);
create index if not exists idx_designs_guest_email on public.designs(guest_email);
create index if not exists idx_designs_product_id on public.designs(product_id);
create index if not exists idx_designs_template_id on public.designs(template_id);
create index if not exists idx_designs_status on public.designs(status);
create index if not exists idx_design_assets_design_id on public.design_assets(design_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_print_partner_id on public.orders(print_partner_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_design_id on public.order_items(design_id);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_order_status_history_order_id on public.order_status_history(order_id);
create index if not exists idx_contact_messages_resolved on public.contact_messages(resolved);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.templates enable row level security;
alter table public.print_partners enable row level security;
alter table public.designs enable row level security;
alter table public.design_assets enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

grant select on public.profiles to authenticated;
revoke insert, update on public.profiles from authenticated;
grant update (full_name, phone, university_code, career, avatar_url, updated_at)
on public.profiles to authenticated;

drop policy if exists "categories_select_active" on public.product_categories;
create policy "categories_select_active"
on public.product_categories for select
using (active = true or public.is_admin());

drop policy if exists "categories_admin_all" on public.product_categories;
create policy "categories_admin_all"
on public.product_categories for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_select_active" on public.products;
create policy "products_select_active"
on public.products for select
using (active = true or public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "templates_select_active" on public.templates;
create policy "templates_select_active"
on public.templates for select
using (active = true or public.is_admin());

drop policy if exists "templates_admin_all" on public.templates;
create policy "templates_admin_all"
on public.templates for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "print_partners_select_staff" on public.print_partners;
create policy "print_partners_select_staff"
on public.print_partners for select
using (public.is_print_partner_or_admin());

drop policy if exists "print_partners_admin_all" on public.print_partners;
create policy "print_partners_admin_all"
on public.print_partners for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "designs_insert_owner" on public.designs;
create policy "designs_insert_owner"
on public.designs for insert
with check (user_id = auth.uid() and guest_email is null);

drop policy if exists "designs_select_owner_public_or_staff" on public.designs;
create policy "designs_select_owner_public_or_staff"
on public.designs for select
using (user_id = auth.uid() or is_public = true or public.is_print_partner_or_admin());

drop policy if exists "designs_update_owner_or_admin" on public.designs;
create policy "designs_update_owner_or_admin"
on public.designs for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "design_assets_insert_owner_or_staff" on public.design_assets;
create policy "design_assets_insert_owner_or_staff"
on public.design_assets for insert
with check (
  public.is_print_partner_or_admin()
  or exists (
    select 1
    from public.designs d
    where d.id = design_assets.design_id
      and d.user_id = auth.uid()
      and design_assets.uploaded_by = auth.uid()
  )
);

drop policy if exists "design_assets_select_owner_public_or_staff" on public.design_assets;
create policy "design_assets_select_owner_public_or_staff"
on public.design_assets for select
using (
  public.is_print_partner_or_admin()
  or exists (
    select 1
    from public.designs d
    where d.id = design_assets.design_id
      and (d.user_id = auth.uid() or d.is_public = true)
  )
);

drop policy if exists "orders_select_owner_or_staff" on public.orders;
create policy "orders_select_owner_or_staff"
on public.orders for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or (public.is_print_partner_or_admin() and print_partner_id is not null)
);

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff"
on public.orders for update
using (public.is_print_partner_or_admin())
with check (public.is_print_partner_or_admin());

drop policy if exists "order_items_select_owner_or_staff" on public.order_items;
create policy "order_items_select_owner_or_staff"
on public.order_items for select
using (
  public.is_print_partner_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "order_items_update_staff" on public.order_items;
create policy "order_items_update_staff"
on public.order_items for update
using (public.is_print_partner_or_admin())
with check (public.is_print_partner_or_admin());

drop policy if exists "payments_select_owner_or_staff" on public.payments;
create policy "payments_select_owner_or_staff"
on public.payments for select
using (
  public.is_print_partner_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "payments_insert_owner_or_staff" on public.payments;
create policy "payments_insert_owner_or_staff"
on public.payments for insert
with check (
  public.is_print_partner_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "payments_update_staff" on public.payments;
create policy "payments_update_staff"
on public.payments for update
using (public.is_print_partner_or_admin())
with check (public.is_print_partner_or_admin());

drop policy if exists "order_status_history_select_owner_or_staff" on public.order_status_history;
create policy "order_status_history_select_owner_or_staff"
on public.order_status_history for select
using (
  public.is_print_partner_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_status_history.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "contact_messages_insert_anyone" on public.contact_messages;
create policy "contact_messages_insert_anyone"
on public.contact_messages for insert
with check (true);

drop policy if exists "contact_messages_admin_all" on public.contact_messages;
create policy "contact_messages_admin_all"
on public.contact_messages for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Supabase Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'design-assets',
  'design-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_design_assets_select" on storage.objects;
create policy "storage_design_assets_select"
on storage.objects for select
using (bucket_id = 'design-assets');

drop policy if exists "storage_design_assets_insert_authenticated" on storage.objects;
create policy "storage_design_assets_insert_authenticated"
on storage.objects for insert
with check (
  bucket_id = 'design-assets'
  and auth.role() = 'authenticated'
);

drop policy if exists "storage_design_assets_update_owner" on storage.objects;
create policy "storage_design_assets_update_owner"
on storage.objects for update
using (
  bucket_id = 'design-assets'
  and owner = auth.uid()
)
with check (
  bucket_id = 'design-assets'
  and owner = auth.uid()
);

drop policy if exists "storage_design_assets_delete_owner" on storage.objects;
create policy "storage_design_assets_delete_owner"
on storage.objects for delete
using (
  bucket_id = 'design-assets'
  and owner = auth.uid()
);

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

insert into public.product_categories (name, slug, description, sort_order)
values
  ('Ropa', 'ropa', 'Prendas personalizadas con identidad universitaria.', 1),
  ('Hogar y oficina', 'hogar-oficina', 'Souvenirs para uso diario.', 2),
  ('Papeleria', 'papeleria', 'Productos impresos para recuerdo y decoracion.', 3),
  ('Accesorios', 'accesorios', 'Accesorios practicos con diseno URP.', 4)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.products (
  category_id,
  name,
  slug,
  description,
  base_price,
  digital_download_price,
  image_url,
  sort_order
)
select
  c.id,
  p.name,
  p.slug,
  p.description,
  p.base_price,
  p.digital_download_price,
  p.image_url,
  p.sort_order
from (
  values
    ('ropa', 'Camisetas', 'camisetas', 'Camisetas personalizadas con tu diseno universitario.', 35.00, 0.00, 'https://images.unsplash.com/photo-1678951558353-3a85c36358bb', 1),
    ('hogar-oficina', 'Tazas', 'tazas', 'Tazas personalizadas para uso diario o regalo.', 25.00, 0.00, 'https://images.unsplash.com/photo-1650959858546-d09833d5317b', 2),
    ('papeleria', 'Posters', 'posters', 'Posters decorativos con estilo universitario.', 20.00, 0.00, 'https://images.unsplash.com/photo-1769283996520-b8a1e5834c5d', 3),
    ('papeleria', 'Diplomas', 'diplomas', 'Diplomas conmemorativos personalizados.', 30.00, 0.00, 'https://images.unsplash.com/photo-1638636241638-aef5120c5153', 4),
    ('accesorios', 'Tote Bags', 'tote-bags', 'Bolsas reutilizables con identidad URP.', 28.00, 0.00, 'https://images.unsplash.com/photo-1574365569389-a10d488ca3fb', 5),
    ('papeleria', 'Stickers', 'stickers', 'Stickers personalizados adhesivos.', 15.00, 0.00, 'https://images.unsplash.com/photo-1591241880902-7f05d345516e', 6)
) as p(category_slug, name, slug, description, base_price, digital_download_price, image_url, sort_order)
join public.product_categories c on c.slug = p.category_slug
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
  sort_order
)
select
  p.id,
  t.name,
  t.slug,
  t.description,
  t.canvas_width,
  t.canvas_height,
  t.config::jsonb,
  t.sort_order
from (
  values
    ('camisetas', 'Plantilla URP Clasica', 'camiseta-urp-clasica', 'Diseno central para camiseta con nombre, carrera, ano y foto.', 1200, 1400, '{"fields":["customer_name","customer_career","graduation_year","source_photo"],"theme":"urp-green"}', 1),
    ('tazas', 'Taza Promocion URP', 'taza-promocion-urp', 'Diseno envolvente para taza universitaria.', 1600, 700, '{"fields":["customer_name","customer_career","graduation_year"],"theme":"urp-green"}', 1),
    ('posters', 'Poster Egresado URP', 'poster-egresado-urp', 'Poster vertical con fotografia y datos academicos.', 1200, 1800, '{"fields":["customer_name","customer_career","graduation_year","source_photo"],"theme":"urp-green"}', 1),
    ('diplomas', 'Diploma Conmemorativo URP', 'diploma-conmemorativo-urp', 'Diploma digital conmemorativo para estudiantes y egresados.', 1600, 1200, '{"fields":["customer_name","customer_career","graduation_year"],"theme":"formal"}', 1),
    ('tote-bags', 'Tote Bag URP Minimal', 'tote-bag-urp-minimal', 'Diseno minimalista para bolsa reutilizable.', 1200, 1400, '{"fields":["customer_name","customer_career"],"theme":"minimal"}', 1),
    ('stickers', 'Sticker URP Personal', 'sticker-urp-personal', 'Sticker circular con nombre, carrera y foto.', 1000, 1000, '{"fields":["customer_name","customer_career","source_photo"],"theme":"badge"}', 1)
) as t(product_slug, name, slug, description, canvas_width, canvas_height, config, sort_order)
join public.products p on p.slug = t.product_slug
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

insert into public.print_partners (
  name,
  contact_name,
  email,
  phone,
  address,
  district,
  commission_rate
)
values (
  'Imprenta aliada demo',
  'Coordinador de pedidos',
  'imprenta.demo@urpprintstudio.com',
  '+51 999 888 777',
  'Av. Alfredo Benavides 5440, Santiago de Surco, Lima',
  'Santiago de Surco',
  15.00
)
on conflict do nothing;

commit;
