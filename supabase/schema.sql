-- Apartments770 — Supabase schema (MVP, stage א')
-- This file is a record of what was run manually in the Supabase SQL Editor.
-- It is NOT auto-applied — it documents the live schema so it isn't lost
-- if something goes wrong in the Supabase project, and so a second
-- environment (e.g. staging) could be recreated from it.
--
-- Run order matters: regions -> owners -> properties -> property_amenities -> property_photos -> property_edits -> admin-only column triggers
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
-- lat/lng are captured from the map picker when a listing is created.
-- walking_minutes_to_landmark is computed once at that same time (via
-- Mapbox Directions, see createProperty in src/lib/properties.ts) and
-- stays null for older listings created before this was added
-- (2026-09-27, homepage redesign) - the distance filter on the
-- homepage treats a null value as "always matches" rather than hiding
-- those listings.
--
-- property_type was added later (2026-09-26, property form wizard) —
-- see docs/handoff-2026-09-26-property-form-wizard-sql.md for the
-- exact migration statement that was run manually in the Supabase
-- SQL Editor for the already-live database.
-- =========================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  region_id uuid not null references public.regions(id),

  address text not null,
  lat numeric,
  lng numeric,
  walking_minutes_to_landmark integer,
  address_notes text,

  property_type text not null default 'apartment'
    check (property_type in ('apartment', 'house', 'basement')),

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
  -- End of the paid display period, set per listing by the admin on
  -- approval. Past this date an approved listing is hidden from the
  -- public site (RLS below). Null = no end date. Added 2026-10-27,
  -- replacing the owner-level owners.subscription_expires_at.
  listing_expires_at timestamptz,
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
  using (
    approval_status = 'approved'
    and (listing_expires_at is null or listing_expires_at > now())
  );

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
--
-- The category/amenity_key CHECK constraints that used to whitelist
-- specific values were dropped (2026-09-26, property form wizard) —
-- validation now lives only in the app, matching the original intent
-- of this table ("new amenity types can be added later without a
-- schema change"). See docs/handoff-2026-09-26-property-form-wizard-sql.md
-- for the exact statements run manually against the live database.
-- Current app-side categories/keys (src/components/PropertyForm.tsx):
--   kitchen: kitchen_hotplate, kitchen_urn, kitchen_fridge, kitchen_stove,
--     kitchen_oven, kitchen_microwave, kitchen_kettle, kitchen_coffee, kitchen_utensils
--   climate: wifi, ac, heating
--   bathroom: linens, toiletries, hairdryer, washer, dryer, iron
--   safety: safe, smoke_detector, fire_extinguisher, first_aid
--   family: crib, games
--   outdoor: balcony, sukkah, parking
--   shabbat_kosher: shabbat_elevator, non_electric_lock, hotplate, shabbat_clock, kosher_kitchen
--   proximity: supermarket, mikvah, bakery, subway
-- =========================================================

create table public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null,
  amenity_key text not null,
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


-- =========================================================
-- 6. property_edits
-- Owner edits to an already-approved listing wait here for admin
-- review, so the live listing keeps showing its approved version
-- until then. payload holds the full proposed listing (the
-- NewPropertyInput shape from src/lib/properties.ts, minus ownerId):
-- fields, amenities and media. Approving applies it to properties /
-- property_amenities / property_photos via the service-role client
-- (src/app/admin/actions.ts). At most one pending edit per property;
-- a new submission replaces the previous pending one.
--
-- Added 2026-10-27 (owner edit approval) - see
-- docs/handoff-2026-10-27-property-edits-sql.md for the statements run
-- manually against the live database.
-- =========================================================

create table public.property_edits (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index property_edits_one_pending_per_property
  on public.property_edits (property_id)
  where status = 'pending';

alter table public.property_edits enable row level security;

create policy "Owners can view their own property edits"
  on public.property_edits
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Owners can submit edits for their own properties"
  on public.property_edits
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.properties p
      where p.id = property_edits.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Owners can withdraw their own pending edits"
  on public.property_edits
  for delete
  to authenticated
  using (owner_id = auth.uid() and status = 'pending');


-- =========================================================
-- 7. Admin-only columns and live listings (security, 2026-10-27)
-- The RLS policies above let an owner insert/update their own rows -
-- but RLS is row-level, not column-level, so on its own it would also
-- let an owner (straight through the public Supabase API, with their
-- own login token) approve their own listing, extend its
-- listing_expires_at or their subscription_expires_at, un-freeze
-- themselves, or change a live listing without admin review. These
-- triggers apply to the public roles (anon, authenticated) only: the
-- admin panel uses the service_role key and the SQL Editor runs as
-- postgres, so neither is affected.
-- See docs/handoff-2026-10-27-security-sql.md.
-- =========================================================

create or replace function public.protect_owner_admin_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_verified := false;
      new.is_first_100 := false;
      new.subscription_expires_at := null;
      new.is_frozen := false;
    else
      new.id := old.id;
      new.is_verified := old.is_verified;
      new.is_first_100 := old.is_first_100;
      new.subscription_expires_at := old.subscription_expires_at;
      new.is_frozen := old.is_frozen;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_owner_admin_columns
  before insert or update on public.owners
  for each row execute function public.protect_owner_admin_columns();

create or replace function public.protect_property_admin_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.approval_status := 'pending_approval';
      new.listing_expires_at := null;
    else
      new.owner_id := old.owner_id;
      new.created_at := old.created_at;
      new.listing_expires_at := old.listing_expires_at;
      -- The one status change an owner may make: resubmitting a
      -- rejected listing for review.
      if not (old.approval_status = 'rejected'
              and new.approval_status = 'pending_approval') then
        new.approval_status := old.approval_status;
      end if;
      -- A live listing changes only through admin review
      -- (property_edits); the owner may still flip its availability.
      if old.approval_status = 'approved'
         and (to_jsonb(new) - 'availability_mode' - 'updated_at')
             is distinct from
             (to_jsonb(old) - 'availability_mode' - 'updated_at') then
        raise exception 'Edits to an approved listing go through admin review (property_edits)';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_property_admin_columns
  before insert or update on public.properties
  for each row execute function public.protect_property_admin_columns();

-- Same rule for a live listing's photos and amenities: an owner can't
-- add, swap or remove them directly, only via property_edits.
create or replace function public.protect_live_listing_children()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if (tg_op <> 'INSERT' and exists (
          select 1 from public.properties p
          where p.id = old.property_id and p.approval_status = 'approved'))
       or (tg_op <> 'DELETE' and exists (
          select 1 from public.properties p
          where p.id = new.property_id and p.approval_status = 'approved')) then
      raise exception 'Edits to an approved listing go through admin review (property_edits)';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_live_listing_amenities
  before insert or update or delete on public.property_amenities
  for each row execute function public.protect_live_listing_children();

create trigger protect_live_listing_photos
  before insert or update or delete on public.property_photos
  for each row execute function public.protect_live_listing_children();
