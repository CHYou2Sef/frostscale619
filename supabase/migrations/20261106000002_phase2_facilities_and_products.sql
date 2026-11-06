-- =============================================================================
-- FROSTSCALE619 — Phase 2: Master Data, Cold Facilities & Ice Catalog
-- Multi-tenant SaaS ERP for Tunisian ice manufacturers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Custom enum types for Phase 2
-- -----------------------------------------------------------------------------
create type public.storage_location_type as enum ('cold_room', 'flake_silo', 'buffer_pit');
create type public.machine_status as enum ('operational', 'maintenance', 'offline');
create type public.ice_production_type as enum ('glacons', 'ecailles', 'blocs');
create type public.product_unit as enum ('sac', 'kg', 'bloc', 'tonne', 'caisse');

-- -----------------------------------------------------------------------------
-- 2. Facilities table (Production sites & depots)
-- -----------------------------------------------------------------------------
create table public.facilities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  code            text not null,
  address         text,
  city            text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Composite unique constraint per tenant
  constraint uq_facility_org_code unique (organization_id, code)
);

alter table public.facilities enable row level security;

create trigger facilities_updated_at
  before update on public.facilities
  for each row execute function public.set_updated_at();

create index idx_facilities_org on public.facilities (organization_id);

-- -----------------------------------------------------------------------------
-- 3. Storage locations table (Chambres froides, Silos, Bacs)
-- -----------------------------------------------------------------------------
create table public.storage_locations (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  facility_id         uuid not null references public.facilities(id) on delete cascade,
  name                text not null,
  type                public.storage_location_type not null default 'cold_room',
  target_temp_celsius numeric(4, 1) not null default -5.0,
  capacity_tonnes     numeric(10, 2) not null default 10.0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint uq_storage_loc_facility_name unique (facility_id, name)
);

alter table public.storage_locations enable row level security;

create trigger storage_locations_updated_at
  before update on public.storage_locations
  for each row execute function public.set_updated_at();

create index idx_storage_locations_org_fac on public.storage_locations (organization_id, facility_id);

-- -----------------------------------------------------------------------------
-- 4. Ice machinery table (Machines à glaçons, Générateurs d'écailles, Moules)
-- -----------------------------------------------------------------------------
create table public.machines (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  facility_id             uuid not null references public.facilities(id) on delete cascade,
  name                    text not null,
  model                   text,
  produces_ice_type       public.ice_production_type not null default 'glacons',
  capacity_tonnes_per_day numeric(10, 2) not null default 5.0,
  status                  public.machine_status not null default 'operational',
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.machines enable row level security;

create trigger machines_updated_at
  before update on public.machines
  for each row execute function public.set_updated_at();

create index idx_machines_org_fac on public.machines (organization_id, facility_id);

-- -----------------------------------------------------------------------------
-- 5. Ice products catalog table (Articles vendus aux mareyeurs, CHR, etc.)
-- -----------------------------------------------------------------------------
create table public.ice_products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  code              text not null,
  ice_type          public.ice_production_type not null default 'glacons',
  unit              public.product_unit not null default 'sac',
  nominal_weight_kg numeric(10, 3) not null default 5.000,
  unit_price_tnd    numeric(10, 3) not null default 0.000, -- Monetary in NUMERIC
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint uq_ice_products_org_code unique (organization_id, code)
);

alter table public.ice_products enable row level security;

create trigger ice_products_updated_at
  before update on public.ice_products
  for each row execute function public.set_updated_at();

create index idx_ice_products_org on public.ice_products (organization_id);

-- -----------------------------------------------------------------------------
-- 6. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- ---- facilities ----
create policy facilities_select on public.facilities
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy facilities_write on public.facilities
  for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]));

-- ---- storage_locations ----
create policy storage_locations_select on public.storage_locations
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy storage_locations_write on public.storage_locations
  for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]));

-- ---- machines ----
create policy machines_select on public.machines
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy machines_write on public.machines
  for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]));

-- ---- ice_products ----
create policy ice_products_select on public.ice_products
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy ice_products_write on public.ice_products
  for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]));
