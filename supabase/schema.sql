create extension if not exists "pgcrypto";

do $$ begin
  create type product_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'cancelled', 'fulfilled');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= price),
  stock integer not null default 0 check (stock >= 0),
  status product_status not null default 'draft',
  highlights text[] not null default '{}',
  badge text,
  image_alt text not null default '',
  accent_from text not null default '#d7a86e',
  accent_to text not null default '#415f4a',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  recipient_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  shipping_address_id uuid references public.addresses(id) on delete set null,
  status order_status not null default 'pending',
  subtotal integer not null default 0 check (subtotal >= 0),
  shipping_total integer not null default 0 check (shipping_total >= 0),
  tax_total integer not null default 0 check (tax_total >= 0),
  total integer not null default 0 check (total >= 0),
  currency text not null default 'USD',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  notes text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists admin_note text;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_sort_order_idx on public.categories (sort_order);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_featured_idx on public.products (featured) where featured = true;
create index if not exists product_images_product_id_sort_order_idx on public.product_images (product_id, sort_order);
create index if not exists customers_email_idx on public.customers (email);
create index if not exists addresses_customer_id_idx on public.addresses (customer_id);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create unique index if not exists orders_stripe_checkout_session_id_idx
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_images_updated_at on public.product_images;
create trigger set_product_images_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_addresses_updated_at on public.addresses;
create trigger set_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_order_items_updated_at on public.order_items;
create trigger set_order_items_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

drop policy if exists "Public can create customers draft" on public.customers;
create policy "Public can create customers draft"
on public.customers for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can create addresses draft" on public.addresses;
create policy "Public can create addresses draft"
on public.addresses for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can create pending orders draft" on public.orders;
create policy "Public can create pending orders draft"
on public.orders for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Users can read their own orders" on public.orders;
create policy "Users can read their own orders"
on public.orders for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Public can create order items draft" on public.order_items;
create policy "Public can create order items draft"
on public.order_items for insert
to anon, authenticated
with check (true);

drop policy if exists "Users can read their own order items" on public.order_items;
create policy "Users can read their own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);
