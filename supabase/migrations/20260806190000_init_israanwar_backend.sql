-- Isra Anwar production backend foundation.
-- Public visitors can read published/active content.
-- Authenticated staff/admin can manage CMS content.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'editor'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.site_settings (
  id text primary key default 'site',
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 'site')
);

create table if not exists public.homepage_sections (
  section_key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  page_key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  category text,
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_published_at_idx on public.posts (status, published_at desc);
create index if not exists posts_category_idx on public.posts (category);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null default '',
  category text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  price integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_created_at_idx on public.products (status, created_at desc);
create index if not exists products_category_idx on public.products (category);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  kind text not null default 'service' check (kind in ('category', 'service')),
  parent_slug text,
  order_index integer not null default 100,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_status_order_idx on public.services (status, order_index asc);
create index if not exists services_parent_slug_idx on public.services (parent_slug);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  filename text,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  name text,
  email text,
  phone text,
  subject text,
  message text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_status_created_at_idx on public.contacts (status, created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'pending_payment',
  customer_email text,
  total integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);
create index if not exists orders_order_number_idx on public.orders (order_number);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists homepage_sections_set_updated_at on public.homepage_sections;
create trigger homepage_sections_set_updated_at before update on public.homepage_sections
for each row execute function public.set_updated_at();

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.pages enable row level security;
alter table public.posts enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.media enable row level security;
alter table public.contacts enable row level security;
alter table public.orders enable row level security;

create policy "Profiles can read own profile"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Admins can update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read site settings"
on public.site_settings for select
using (true);

create policy "Staff can manage site settings"
on public.site_settings for all
using (public.is_staff())
with check (public.is_staff());

create policy "Public can read homepage sections"
on public.homepage_sections for select
using (true);

create policy "Staff can manage homepage sections"
on public.homepage_sections for all
using (public.is_staff())
with check (public.is_staff());

create policy "Public can read pages"
on public.pages for select
using (true);

create policy "Staff can manage pages"
on public.pages for all
using (public.is_staff())
with check (public.is_staff());

create policy "Public can read published posts"
on public.posts for select
using (status = 'published' or public.is_staff());

create policy "Staff can manage posts"
on public.posts for all
using (public.is_staff())
with check (public.is_staff());

create policy "Public can read active products"
on public.products for select
using (status = 'active' or public.is_staff());

create policy "Staff can manage products"
on public.products for all
using (public.is_staff())
with check (public.is_staff());

create policy "Public can read active services"
on public.services for select
using (status = 'active' or public.is_staff());

create policy "Staff can manage services"
on public.services for all
using (public.is_staff())
with check (public.is_staff());

create policy "Public can read media"
on public.media for select
using (true);

create policy "Staff can manage media"
on public.media for all
using (public.is_staff())
with check (public.is_staff());

create policy "Anyone can submit contacts"
on public.contacts for insert
with check (true);

create policy "Staff can manage contacts"
on public.contacts for all
using (public.is_staff())
with check (public.is_staff());

create policy "Anyone can create orders"
on public.orders for insert
with check (status = 'pending_payment');

create policy "Staff can manage orders"
on public.orders for all
using (public.is_staff())
with check (public.is_staff());

create or replace function public.get_order_by_number(order_no text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(o)
  from public.orders o
  where o.order_number = order_no
  limit 1;
$$;

create or replace function public.mark_order_waiting_verification(order_no text, proof_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_order public.orders;
begin
  update public.orders
  set status = 'waiting_verification',
      data = jsonb_set(
        jsonb_set(data, '{payment_proof}', to_jsonb(proof_url), true),
        '{payment_proof_uploaded_at}',
        to_jsonb(now()::text),
        true
      )
  where order_number = order_no
    and status in ('pending_payment', 'waiting_verification')
  returning * into updated_order;

  return to_jsonb(updated_order);
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'israanwar-media',
  'israanwar-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read israanwar media objects"
on storage.objects for select
using (bucket_id = 'israanwar-media');

create policy "Staff can upload israanwar media objects"
on storage.objects for insert
with check (bucket_id = 'israanwar-media' and public.is_staff());

create policy "Staff can update israanwar media objects"
on storage.objects for update
using (bucket_id = 'israanwar-media' and public.is_staff())
with check (bucket_id = 'israanwar-media' and public.is_staff());

create policy "Staff can delete israanwar media objects"
on storage.objects for delete
using (bucket_id = 'israanwar-media' and public.is_staff());
