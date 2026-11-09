-- =============================================================================
-- FROSTSCALE619 — Phase 4: Clients, Logistics & Delivery Tracking
-- Multi-tenant SaaS ERP for Tunisian ice manufacturers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Custom enum types for Phase 4
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_category') then
    create type public.client_category as enum (
      'mareyeur',          -- Grossiste marée / halle aux poissons de port
      'poissonnerie',       -- Commerce de détail de produits de la mer
      'chr',                -- Café, Hôtel, Restaurant, Traiteur
      'peche_artisanale',   -- Chalutier, sardinier, barque de pêche côtière
      'industriel'          -- Usine de transformation de conserve / surgélation
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum (
      'idle',
      'pending',
      'in_transit',
      'delivered'
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Clients Table (Commercial partners & delivery delivery points)
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  name                  text not null,
  slug                  text not null,
  category              public.client_category not null default 'mareyeur',
  city                  text not null,
  port_or_zone          text,
  address               text,
  latitude              numeric(10, 6) not null,
  longitude             numeric(10, 6) not null,
  phone                 text,
  contact_name          text,
  tax_id                text, -- Matricule fiscal tunisien
  ice_preference        public.ice_production_type not null default 'ecailles',
  containers_balance    integer not null default 0, -- Bacs isothermes consignés chez ce client
  delivery_status       public.delivery_status not null default 'idle',
  last_order_amount_tnd numeric(10, 3) not null default 0.000,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint uq_client_org_slug unique (organization_id, slug),
  constraint chk_client_coords check (
    latitude >= 30.0 and latitude <= 38.0 and
    longitude >= 7.0 and longitude <= 12.5
  )
);

alter table public.clients enable row level security;

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create index if not exists idx_clients_org on public.clients (organization_id);
create index if not exists idx_clients_geo on public.clients (organization_id, latitude, longitude);
create index if not exists idx_clients_category on public.clients (organization_id, category);
create index if not exists idx_clients_delivery on public.clients (organization_id, delivery_status);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security Policies for Clients
-- -----------------------------------------------------------------------------

-- All active members can read clients belonging to their organization
create policy "clients_select_member"
  on public.clients
  for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = clients.organization_id
        and organization_members.user_id = (select auth.uid())
        and organization_members.status = 'active'
    )
  );

-- Only owners and admins can create clients
create policy "clients_insert_admin"
  on public.clients
  for insert
  with check (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = clients.organization_id
        and organization_members.user_id = (select auth.uid())
        and organization_members.status = 'active'
        and organization_members.role in ('owner', 'admin')
    )
  );

-- Owners, admins, and operators can update client tracking info (e.g., container count or status)
create policy "clients_update_staff"
  on public.clients
  for update
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = clients.organization_id
        and organization_members.user_id = (select auth.uid())
        and organization_members.status = 'active'
        and organization_members.role in ('owner', 'admin', 'operator')
    )
  );

-- Only owners can delete a client
create policy "clients_delete_owner"
  on public.clients
  for delete
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = clients.organization_id
        and organization_members.user_id = (select auth.uid())
        and organization_members.status = 'active'
        and organization_members.role = 'owner'
    )
  );
