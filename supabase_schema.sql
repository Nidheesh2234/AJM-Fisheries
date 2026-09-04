-- 1. SECURITY DEFINER HELPER FUNCTION
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

-- Schema migration for existing tables
alter table public.profiles add column if not exists full_name text default '';
alter table public.profiles add column if not exists role text default 'customer';
alter table public.profiles add column if not exists delivery_address text default '';
alter table public.profiles add column if not exists google_maps_link text default '';

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- Auto-create profile trigger
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


-- 3. INVENTORY TABLE (Extended with Image, Local Name, Unit, Category & Sort Order)
-- ============================================================
create table if not exists public.inventory (
  id bigint generated always as identity primary key,
  species text not null,
  local_name text default '',
  current_price_inr numeric(10,2) not null default 0,
  unit text default 'kg',
  category text default 'Fish',
  image_url text default '',
  sort_order int default 0,
  status text default 'Available' check (status in ('Available', 'Out of Season')),
  created_at timestamptz default now()
);

-- Schema migration for existing tables
alter table public.inventory add column if not exists local_name text default '';
alter table public.inventory add column if not exists current_price_inr numeric(10,2) default 0;
alter table public.inventory add column if not exists unit text default 'kg';
alter table public.inventory add column if not exists category text default 'Fish';
alter table public.inventory add column if not exists image_url text default '';
alter table public.inventory add column if not exists sort_order int default 0;
alter table public.inventory add column if not exists status text default 'Available';

alter table public.inventory enable row level security;
drop policy if exists "Anyone can read inventory" on public.inventory;
drop policy if exists "Admins can insert inventory" on public.inventory;
drop policy if exists "Admins can update inventory" on public.inventory;
drop policy if exists "Admins can delete inventory" on public.inventory;

create policy "Anyone can read inventory" on public.inventory for select using (true);
create policy "Admins can insert inventory" on public.inventory for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update inventory" on public.inventory for update using (public.is_admin(auth.uid()));
create policy "Admins can delete inventory" on public.inventory for delete using (public.is_admin(auth.uid()));


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

-- Schema migration for existing tables
alter table public.orders add column if not exists order_ref text;
alter table public.orders add column if not exists customer_name text default '';
alter table public.orders add column if not exists fish_type text;
alter table public.orders add column if not exists quantity numeric(10,2);
alter table public.orders add column if not exists quantity_unit text default 'kg';
alter table public.orders add column if not exists total_price_inr numeric(12,2) default 0;
alter table public.orders add column if not exists delivery_location text default '';
alter table public.orders add column if not exists google_maps_link text default '';
alter table public.orders add column if not exists tracking_link text default '';
alter table public.orders add column if not exists status text default 'Pending';

alter table public.orders enable row level security;
drop policy if exists "Customers can view own orders" on public.orders;
drop policy if exists "Authenticated users can place orders" on public.orders;
drop policy if exists "Admins can update orders" on public.orders;

create policy "Customers can view own orders" on public.orders for select using (auth.uid() = customer_id or public.is_admin(auth.uid()));
create policy "Authenticated users can place orders" on public.orders for insert with check (auth.uid() = customer_id);
create policy "Admins can update orders" on public.orders for update using (public.is_admin(auth.uid()));


-- 5. TESTIMONIALS TABLE
-- ============================================================
create table if not exists public.testimonials (
  id bigint generated always as identity primary key,
  quote text not null,
  author_name text not null,
  role text default '',
  created_at timestamptz default now()
);

alter table public.testimonials enable row level security;
drop policy if exists "Anyone can read testimonials" on public.testimonials;
drop policy if exists "Admins can insert testimonials" on public.testimonials;
drop policy if exists "Admins can update testimonials" on public.testimonials;
drop policy if exists "Admins can delete testimonials" on public.testimonials;

create policy "Anyone can read testimonials" on public.testimonials for select using (true);
create policy "Admins can insert testimonials" on public.testimonials for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update testimonials" on public.testimonials for update using (public.is_admin(auth.uid()));
create policy "Admins can delete testimonials" on public.testimonials for delete using (public.is_admin(auth.uid()));


-- 6. PARTNER NETWORK CARDS TABLE
-- ============================================================
create table if not exists public.partner_cards (
  id bigint generated always as identity primary key,
  title text not null,
  description text default '',
  image_url text default '',
  created_at timestamptz default now()
);

alter table public.partner_cards enable row level security;
drop policy if exists "Anyone can read partner_cards" on public.partner_cards;
drop policy if exists "Admins can insert partner_cards" on public.partner_cards;
drop policy if exists "Admins can update partner_cards" on public.partner_cards;
drop policy if exists "Admins can delete partner_cards" on public.partner_cards;

create policy "Anyone can read partner_cards" on public.partner_cards for select using (true);
create policy "Admins can insert partner_cards" on public.partner_cards for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update partner_cards" on public.partner_cards for update using (public.is_admin(auth.uid()));
create policy "Admins can delete partner_cards" on public.partner_cards for delete using (public.is_admin(auth.uid()));


-- 7. VALUE / LOGISTICS CARDS TABLE
-- ============================================================
create table if not exists public.value_cards (
  id bigint generated always as identity primary key,
  heading text not null,
  description text default '',
  image_url text default '',
  created_at timestamptz default now()
);

alter table public.value_cards enable row level security;
drop policy if exists "Anyone can read value_cards" on public.value_cards;
drop policy if exists "Admins can insert value_cards" on public.value_cards;
drop policy if exists "Admins can update value_cards" on public.value_cards;
drop policy if exists "Admins can delete value_cards" on public.value_cards;

create policy "Anyone can read value_cards" on public.value_cards for select using (true);
create policy "Admins can insert value_cards" on public.value_cards for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update value_cards" on public.value_cards for update using (public.is_admin(auth.uid()));
create policy "Admins can delete value_cards" on public.value_cards for delete using (public.is_admin(auth.uid()));


-- 8. SITE SETTINGS TABLE
-- ============================================================
create table if not exists public.site_settings (
  key text primary key,
  value text default '',
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;
drop policy if exists "Anyone can read site_settings" on public.site_settings;
drop policy if exists "Admins can insert site_settings" on public.site_settings;
drop policy if exists "Admins can update site_settings" on public.site_settings;

create policy "Anyone can read site_settings" on public.site_settings for select using (true);
create policy "Admins can insert site_settings" on public.site_settings for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update site_settings" on public.site_settings for update using (public.is_admin(auth.uid()));



-- 9. SEED DATA FOR INVENTORY & CMS TABLES
-- ============================================================
insert into public.inventory (species, local_name, current_price_inr, unit, category, image_url, sort_order, status)
select species, local_name, current_price_inr, unit, category, image_url, sort_order, status from (values
  ('White Pomfret', 'Chanduva', 850.00, 'kg', 'Fish', 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=85', 1, 'Available'),
  ('Seer Fish / Kingfish', 'Konema', 950.00, 'kg', 'Fish', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=85', 2, 'Available'),
  ('Bay Tiger Prawns', 'Royyalu', 650.00, 'kg', 'Shellfish', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=85', 3, 'Available'),
  ('Indian Mackerel', 'Kanagarthalu', 250.00, 'kg', 'Fish', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=85', 4, 'Available'),
  ('Vizag Mud Crab', 'Peethalu', 450.00, 'kg', 'Crab', 'https://images.unsplash.com/photo-1559737671-67858c142e05?auto=format&fit=crop&w=600&q=85', 5, 'Out of Season'),
  ('Bay Yellowfin Tuna', 'Soora', 750.00, 'kg', 'Fish', 'https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=600&q=85', 6, 'Available')
) as v(species, local_name, current_price_inr, unit, category, image_url, sort_order, status)
where not exists (select 1 from public.inventory);

insert into public.testimonials (quote, author_name, role)
select quote, author_name, role from (values
  ('Transitioning our seafood procurement to AJM Fisheries Vizag cut our supply chains by 3 days. The Seer Fish arrives in perfect cold-chain condition directly at our RK Beach hotel depot.', 'N. Ramakrishna', 'Culinary Director, Grand Andhra Resort'),
  ('Having instant daily INR rate disclosures makes commercial catering bidding highly predictable. The Google Maps delivery coordinate dropoff ensures cargo container logistics run smoothly.', 'Pranav Sharma', 'Logistics Lead, Oceanic Processors Ltd')
) as v(quote, author_name, role)
where not exists (select 1 from public.testimonials);

insert into public.partner_cards (title, description, image_url)
select title, description, image_url from (values
  ('Five-Star Hotels', 'Premium pomfret & lobster', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=85'),
  ('Restaurant Chains', 'Consistent wholesale fish supply', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=85'),
  ('Export Houses', 'Flash-frozen tiger prawns', 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=400&q=85'),
  ('Supermarket Docks', 'Daily packed distribution units', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=85')
) as v(title, description, image_url)
where not exists (select 1 from public.partner_cards);

insert into public.value_cards (heading, description, image_url)
select heading, description, image_url from (values
  ('Direct Fleet Sourcing', 'Our fleet navigates the deep waters of the Bay of Bengal, returning fresh catches directly to our private docks at Visakhapatnam harbour.', 'https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=800&q=85'),
  ('Price Transparency', 'No hidden brokerage fees. Daily updated INR rates are published directly from dock landing ledgers onto our digital market board.', 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&w=800&q=85'),
  ('GPS Tracked Cold-Chain', 'Transported in temperature-monitored refrigerated freighter containers. Deliveries are dispatched using Google Maps coordinate tracking.', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=85')
) as v(heading, description, image_url)
where not exists (select 1 from public.value_cards);

insert into public.site_settings (key, value)
select key, value from (values
  ('hero_title', 'Visakhapatnam''s Most Trusted Direct Seafood Partner'),
  ('hero_subtitle', 'Direct-from-harbour bulk seafood supply for hotels, restaurant chains, caterers, and regional distributors across Andhra Pradesh. Zero middleman markups, transparent daily pricing in Indian Rupees (₹), and temperature-controlled local logistics.'),
  ('stat_1_num', '10,000+'),
  ('stat_1_label', 'KG Daily Catch'),
  ('stat_2_num', '100%'),
  ('stat_2_label', 'Direct Harbour Sourced'),
  ('stat_3_num', '0%'),
  ('stat_3_label', 'Middlemen Markups'),
  ('stat_4_num', '18+'),
  ('stat_4_label', 'Years Serving Vizag'),
  ('founder_story_title', 'From Vizag Harbour Docks to Andhra''s Finest Tables'),
  ('founder_story_body', 'Founded over 18 years ago at the historic Visakhapatnam Fishing Harbour, AJM Fisheries began with a single trawler and a firm belief: local businesses deserve fresh, unadulterated seafood straight from the harbour floor without paying inflated middleman commissions. Today, we directly serve top culinary institutions, luxury resorts, and high-volume dining establishments across Andhra Pradesh with daily temperature-guaranteed deliveries.'),
  ('founder_name', 'A.J. Mohan & Sons'),
  ('founder_since_year', 'Est. 2008'),
  ('founder_story_image_url', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=85'),
  ('about_section_eyebrow', 'DIRECT DOCK OPERATIONS'),
  ('about_section_title', 'The Visakhapatnam Advantage: Freshness Measured in Hours, Not Days'),
  ('about_section_body_1', 'Located right at the Visakhapatnam Fishing Harbour, our dockside processing facility receives catches straight off local trawlers at dawn. Every specimen is inspected, cleaned, size-graded, and iced immediately to lock in ocean freshness.'),
  ('about_section_body_2', 'By eliminating multi-layer wholesale brokers, we give Vizag and Andhra Pradesh chefs guaranteed cold-chain integrity, dependable supply consistency, and honest harbour-direct pricing in INR.'),
  ('how_it_works_eyebrow', 'OUR DIRECT SUPPLY CHAIN'),
  ('how_it_works_title', 'From Harbour Dock to Your Kitchen in 4 Seamless Steps'),
  ('how_it_works_subtitle', 'Experience an uninterrupted cold chain designed specifically for commercial hospitality and food service buyers.'),
  ('closing_cta_headline', 'Ready for Direct-from-Harbour Seafood Supply?'),
  ('closing_cta_body', 'Join Visakhapatnam''s leading hotels, restaurants, and caterers who rely on AJM Fisheries for daily fresh catch, transparent pricing, and guaranteed delivery.'),
  ('closing_cta_button_text', 'View Today''s Local Rates'),
  ('footer_phone', '+91 891 255 1204'),
  ('footer_email', 'wholesale@ajmfisheries.com'),
  ('footer_gstin', '37AAHCA8492K1Z9'),
  ('footer_address', 'Dockside Gate 4, Vizag Fishing Harbour, Visakhapatnam, 530001, AP, India')
) as v(key, value)
on conflict (key) do nothing;


-- 10. CERTIFICATIONS TABLE
-- ============================================================
create table if not exists public.certifications (
  id bigint generated always as identity primary key,
  label text not null,
  badge_icon_url text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.certifications enable row level security;
drop policy if exists "Anyone can read certifications" on public.certifications;
drop policy if exists "Admins can insert certifications" on public.certifications;
drop policy if exists "Admins can update certifications" on public.certifications;
drop policy if exists "Admins can delete certifications" on public.certifications;

create policy "Anyone can read certifications" on public.certifications for select using (true);
create policy "Admins can insert certifications" on public.certifications for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update certifications" on public.certifications for update using (public.is_admin(auth.uid()));
create policy "Admins can delete certifications" on public.certifications for delete using (public.is_admin(auth.uid()));

-- 11. HOW IT WORKS STEPS TABLE
-- ============================================================
create table if not exists public.how_it_works_steps (
  id bigint generated always as identity primary key,
  step_number int not null,
  title text not null,
  description text default '',
  icon_name text default 'anchor',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.how_it_works_steps enable row level security;
drop policy if exists "Anyone can read how_it_works_steps" on public.how_it_works_steps;
drop policy if exists "Admins can insert how_it_works_steps" on public.how_it_works_steps;
drop policy if exists "Admins can update how_it_works_steps" on public.how_it_works_steps;
drop policy if exists "Admins can delete how_it_works_steps" on public.how_it_works_steps;

create policy "Anyone can read how_it_works_steps" on public.how_it_works_steps for select using (true);
create policy "Admins can insert how_it_works_steps" on public.how_it_works_steps for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update how_it_works_steps" on public.how_it_works_steps for update using (public.is_admin(auth.uid()));
create policy "Admins can delete how_it_works_steps" on public.how_it_works_steps for delete using (public.is_admin(auth.uid()));

-- 12. CLIENT LOGOS TABLE
-- ============================================================
create table if not exists public.client_logos (
  id bigint generated always as identity primary key,
  client_name text not null,
  logo_url text default '',
  is_placeholder boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.client_logos enable row level security;
drop policy if exists "Anyone can read client_logos" on public.client_logos;
drop policy if exists "Admins can insert client_logos" on public.client_logos;
drop policy if exists "Admins can update client_logos" on public.client_logos;
drop policy if exists "Admins can delete client_logos" on public.client_logos;

create policy "Anyone can read client_logos" on public.client_logos for select using (true);
create policy "Admins can insert client_logos" on public.client_logos for insert with check (public.is_admin(auth.uid()));
create policy "Admins can update client_logos" on public.client_logos for update using (public.is_admin(auth.uid()));
create policy "Admins can delete client_logos" on public.client_logos for delete using (public.is_admin(auth.uid()));

-- Seed Certifications
insert into public.certifications (label, badge_icon_url, sort_order)
select label, badge_icon_url, sort_order from (values
  ('FSSAI Wholesale License', '', 1),
  ('GST Registered Business', '', 2),
  ('Zero-Broker Harbour Direct', '', 3),
  ('Sub-Zero Cold Chain Logistics', '', 4),
  ('Vizag Health Dept Compliance', '', 5)
) as v(label, badge_icon_url, sort_order)
where not exists (select 1 from public.certifications);

-- Seed How It Works Steps
insert into public.how_it_works_steps (step_number, title, description, icon_name, sort_order)
select step_number, title, description, icon_name, sort_order from (values
  (1, 'Harbour Landing', 'Our local trawlers dock daily at dawn at Visakhapatnam Fishing Harbour with freshly harvested Bay of Bengal catch.', 'anchor', 1),
  (2, 'Sorting & Flake Icing', 'Seafood is immediately inspected, graded by size/weight, and layered in sub-zero flake ice crates right on the dock floor.', 'snowflake', 2),
  (3, 'Cold Storage Transit', 'Loaded directly into temperature-monitored refrigerated transport vans within 60 minutes of dock landing.', 'truck', 3),
  (4, 'Your Doorstep Delivery', 'Delivered straight to your hotel, restaurant, or commercial kitchen across Vizag and AP with full invoice transparency.', 'home', 4)
) as v(step_number, title, description, icon_name, sort_order)
where not exists (select 1 from public.how_it_works_steps);

-- Seed Client Logos (Placeholders for local partners)
insert into public.client_logos (client_name, logo_url, is_placeholder, sort_order)
select client_name, logo_url, is_placeholder, sort_order from (values
  ('Grand Coastal Hotel Vizag', '', true, 1),
  ('Andhra Spice Restaurant Chain', '', true, 2),
  ('Bayview Luxury Resort & Spa', '', true, 3),
  ('Oceanic Catering Services', '', true, 4),
  ('Vizag Seafood Distributors', '', true, 5)
) as v(client_name, logo_url, is_placeholder, sort_order)
where not exists (select 1 from public.client_logos);

