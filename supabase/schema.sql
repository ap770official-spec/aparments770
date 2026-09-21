-- Apartments770 — Supabase schema (MVP, stage א')
-- This file is a record of what was run manually in the Supabase SQL Editor.
-- It is NOT auto-applied — it documents the live schema so it isn't lost
-- if something goes wrong in the Supabase project, and so a second
-- environment (e.g. staging) could be recreated from it.
--
-- Run order matters: regions -> owners -> properties -> property_amenities -> property_photos
-- (each later table references an earlier one via foreign key).

-- =========================================================
-- 1. regions
-- Fixed list of service regions (Crown Heights, The Ohel today),
-- kept as data (not hardcoded in app code) so adding a region later
-- is an admin operation, not a code change.
-- =========================================================

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_he text not null,
  name_en text not null,
  landmark_address text not null,
  landmark_lat numeric,
  landmark_lng numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.regions (slug, name_he, name_en, landmark_address) values
  ('crown-heights', 'קראון הייטס', 'Crown Heights', '770 Eastern Parkway, Brooklyn, NY 11213'),
  ('the-ohel', 'האוהל', 'The Ohel', '226-20 Francis Lewis Blvd, Cambria Heights, NY 11411');

alter table public.regions enable row level security;

create policy "Public can view regions"
  on public.regions
  for select
  to anon, authenticated
  using (true);


-- =========================================================
-- 2. owners
-- Profile data for property owners, keyed 1:1 to Supabase Auth users.
-- Contains sensitive verification data (id_document_url), so RLS
-- restricts each owner to their own row only. Admin access (later)
-- goes through the service_role key, which bypasses RLS entirely.
-- =========================================================

create table public.owners (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  profile_photo_url text,
  id_document_url text,
  is_verified boolean not null default false,
  is_first_100 boolean not null default false,
  subscription_expires_at timestamptz,
  is_frozen boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.owners enable row level security;

create policy "Owners can view their own profile"
  on public.owners
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Owners can insert their own profile"
  on public.owners
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Owners can update their own profile"
  on public.owners
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- =========================================================
-- 3. properties
-- The listings themselves. Two independent status fields:
--   approval_status   — admin-controlled (site visibility)
--   availability_mode — owner-controlled (booking availability)
-- lat/lng/walking_minutes_to_landmark are left null until the
-- Mapbox integration is built (stage ד').
-- =========================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  region_id uuid not null references public.regions(id),

  address text not null,
  lat numeric,
  lng numeric,
  walking_minutes_to_landmark integer,

  bedrooms smallint not null default 0 check (bedrooms between 0 and 30),
  beds smallint not null default 0 check (beds between 0 and 30),
  toilets smallint not null default 0 check (toilets between 0 and 30),
  bathtubs smallint not null default 0 check (bathtubs between 0 and 30),

  price_per_night numeric(10,2) not null,

  phone_country_code text not null,
  phone_number text not null,

  checkin_time time,
  checkout_time time,
  max_guests smallint,
  min_nights smallint,

  description_he text,
  description_en text,
  description_source_lang text check (description_source_lang in ('he','en')),

  approval_status text not null default 'pending_approval'
    check (approval_status in ('pending_approval','approved','rejected')),
  availability_mode text not null default 'default_open_block_dates'
    check (availability_mode in ('fully_locked','default_open_block_dates','default_closed_open_dates')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Public can view approved properties"
  on public.properties
  for select
  to anon, authenticated
  using (approval_status = 'approved');

create policy "Owners can view their own properties"
  on public.properties
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Owners can insert their own properties"
  on public.properties
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update their own properties"
  on public.properties
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- =========================================================
-- 4. property_amenities
-- One row per (property, amenity) instead of boolean columns on
-- properties, so new amenity types can be added later without a
-- schema change. RLS checks ownership via a join to properties,
-- since this table has no owner_id column of its own.
-- =========================================================

create table public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null check (category in ('general','shabbat_kosher','proximity')),
  amenity_key text not null check (amenity_key in (
    'dryer','balcony_yard','iron','storage_closets','crib','elevator',
    'shabbat_elevator','non_electric_lock','hotplate','shabbat_clock','kosher_kitchen','sukkah',
    'supermarket','mikvah','bakery','subway'
  )),
  primary key (property_id, amenity_key)
);

alter table public.property_amenities enable row level security;

create policy "Public can view amenities of approved properties"
  on public.property_amenities
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.approval_status = 'approved'
    )
  );

create policy "Owners can view amenities of their own properties"
  on public.property_amenities
  for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can insert amenities for their own properties"
  on public.property_amenities
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can delete amenities for their own properties"
  on public.property_amenities
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.owner_id = auth.uid()
    )
  );


-- =========================================================
-- 5. property_photos
-- Cloudinary URLs only — the files themselves live in Cloudinary,
-- not in Supabase storage. sort_order controls display order
-- (lowest = main photo).
-- =========================================================

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.property_photos enable row level security;

create policy "Public can view photos of approved properties"
  on public.property_photos
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.approval_status = 'approved'
    )
  );

create policy "Owners can view photos of their own properties"
  on public.property_photos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can insert photos for their own properties"
  on public.property_photos
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can update photos of their own properties"
  on public.property_photos
  for update
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can delete photos of their own properties"
  on public.property_photos
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_photos.property_id
        and p.owner_id = auth.uid()
    )
  );
