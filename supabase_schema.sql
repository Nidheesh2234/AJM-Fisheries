-- ============================================================
-- AJM Fisheries — Supabase Schema Migration (Deep Tide Theme)
-- Run this entire script in the Supabase SQL Editor to reset/fix.
-- ============================================================

-- Drop existing policies & functions to ensure clean application
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Anyone can read inventory" on public.inventory;
drop policy if exists "Admins can insert inventory" on public.inventory;
drop policy if exists "Admins can update inventory" on public.inventory;
drop policy if exists "Admins can delete inventory" on public.inventory;
drop policy if exists "Customers can view own orders" on public.orders;
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Authenticated users can place orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;

-- 1. SECURITY DEFINER HELPER FUNCTION (Bypasses RLS to prevent infinite recursion)
-- ============================================================
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

-- 2. PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text default '',
  role text default 'customer' check (role in ('customer', 'admin')),
  delivery_address text default '',
  google_maps_link text default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles RLS
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- Auto-create profile on signup trigger (Automatically grants admin role to @ajm.com emails)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when new.email ilike '%@ajm.com' then 'admin' else 'customer' end
  )
  on conflict (id) do update set
    role = case when new.email ilike '%@ajm.com' then 'admin' else public.profiles.role end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 3. INVENTORY TABLE
-- ============================================================
create table if not exists public.inventory (
  id bigint generated always as identity primary key,
  species text not null,
  current_price_inr numeric(10,2) not null default 0,
  status text default 'Available' check (status in ('Available', 'Out of Season')),
  created_at timestamptz default now()
);

alter table public.inventory enable row level security;

-- Inventory RLS
create policy "Anyone can read inventory"
  on public.inventory for select
  using (true);

create policy "Admins can insert inventory"
  on public.inventory for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can update inventory"
  on public.inventory for update
  using (public.is_admin(auth.uid()));

create policy "Admins can delete inventory"
  on public.inventory for delete
  using (public.is_admin(auth.uid()));


-- 4. ORDERS TABLE
-- ============================================================
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_ref text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text default '',
  fish_type text not null,
  quantity numeric(10,2) not null,
  quantity_unit text default 'kg' check (quantity_unit in ('kg', 'tons')),
  total_price_inr numeric(12,2) not null default 0,
  delivery_location text default '',
  google_maps_link text default '',
  tracking_link text default '',
  status text default 'Pending' check (status in ('Pending', 'Dispatched', 'Delivered')),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

-- Orders RLS
create policy "Customers can view own orders"
  on public.orders for select
  using (auth.uid() = customer_id or public.is_admin(auth.uid()));

create policy "Authenticated users can place orders"
  on public.orders for insert
  with check (auth.uid() = customer_id);

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin(auth.uid()));


-- 5. SEED INVENTORY DATA
-- ============================================================
insert into public.inventory (species, current_price_inr, status)
select species, current_price_inr, status from (values
  ('White Pomfret (Chanduva)', 850.00, 'Available'),
  ('Seer Fish / Kingfish (Konema)', 950.00, 'Available'),
  ('Bay Tiger Prawns (Royyalu)', 650.00, 'Available'),
  ('Indian Mackerel (Kanagarthalu)', 250.00, 'Available'),
  ('Vizag Mud Crab (Peethalu)', 450.00, 'Out of Season'),
  ('Bay Yellowfin Tuna (Soora)', 750.00, 'Available')
) as v(species, current_price_inr, status)
where not exists (select 1 from public.inventory);


-- ============================================================
-- INSTANT FIX FOR "EMAIL NOT CONFIRMED" ERROR:
-- Run this command in Supabase SQL Editor to immediately confirm all user accounts:
-- 
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
-- ============================================================
