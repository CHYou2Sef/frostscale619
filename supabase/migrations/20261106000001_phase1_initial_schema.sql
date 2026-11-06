-- =============================================================================
-- FROSTSCALE619 — Phase 1: Foundation Schema
-- Multi-tenant SaaS ERP for Tunisian ice manufacturers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Custom enum types
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('owner', 'admin', 'operator', 'driver');
create type public.membership_status as enum ('active', 'suspended', 'invited');

-- -----------------------------------------------------------------------------
-- 2. Utility: auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Profiles table (extends auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Organizations table (tenants)
-- -----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  legal_name  text,
  tax_id      text,                -- Matricule Fiscal (Tunisie)
  phone       text,
  address     text,
  city        text,
  country     text not null default 'TN',
  currency    text not null default 'TND',
  ice_types   text[] not null default '{"glacons"}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- Index on slug for fast lookups
create index idx_organizations_slug on public.organizations (slug);

-- -----------------------------------------------------------------------------
-- 5. Organization members (join table: profiles <-> organizations)
-- -----------------------------------------------------------------------------
create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            public.app_role not null default 'operator',
  status          public.membership_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Composite unique: one membership per user per organization
  constraint uq_org_member unique (organization_id, user_id)
);

alter table public.organization_members enable row level security;

create trigger org_members_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- Composite indexes for common query patterns
create index idx_org_members_user_org on public.organization_members (user_id, organization_id);
create index idx_org_members_org_role on public.organization_members (organization_id, role);

-- -----------------------------------------------------------------------------
-- 6. Auth trigger: auto-create profile on user signup
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 7. Security helper functions (used by RLS policies)
--    Wrapped in (select ...) for single-evaluation per query plan
-- -----------------------------------------------------------------------------

-- Returns all active organization IDs for the calling user
create or replace function public.get_user_org_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select organization_id
  from public.organization_members
  where user_id = (select auth.uid())
    and status = 'active';
$$;

-- Checks if the calling user is an active member of an organization
-- with one of the allowed roles
create or replace function public.is_org_member(
  target_org_id uuid,
  allowed_roles public.app_role[] default null
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org_id
      and user_id = (select auth.uid())
      and status = 'active'
      and (allowed_roles is null or role = any(allowed_roles))
  );
$$;

-- -----------------------------------------------------------------------------
-- 8. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- ---- profiles ----

-- Users can read their own profile
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Users can read profiles of colleagues in their organizations
create policy profiles_select_org_colleagues on public.profiles
  for select to authenticated
  using (
    id in (
      select om.user_id
      from public.organization_members om
      where om.organization_id in (select public.get_user_org_ids())
        and om.status = 'active'
    )
  );

-- Users can update only their own profile
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---- organizations ----

-- Members can view their organizations
create policy organizations_select_member on public.organizations
  for select to authenticated
  using (id in (select public.get_user_org_ids()));

-- Any authenticated user can insert (to create a new org during onboarding)
create policy organizations_insert_authenticated on public.organizations
  for insert to authenticated
  with check (true);

-- Only owner can update organization
create policy organizations_update_owner on public.organizations
  for update to authenticated
  using (public.is_org_member(id, array['owner']::public.app_role[]))
  with check (public.is_org_member(id, array['owner']::public.app_role[]));

-- ---- organization_members ----

-- Members can view fellow members in their organization
create policy org_members_select on public.organization_members
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

-- Members can insert themselves (for onboarding) or owner/admin can add
create policy org_members_insert on public.organization_members
  for insert to authenticated
  with check (
    -- User creating their own membership (onboarding)
    user_id = (select auth.uid())
    or
    -- Owner or admin adding someone
    public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[])
  );

-- Only owner or admin can update memberships
create policy org_members_update on public.organization_members
  for update to authenticated
  using (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[]));

-- Only owner can delete memberships
create policy org_members_delete on public.organization_members
  for delete to authenticated
  using (public.is_org_member(organization_id, array['owner']::public.app_role[]));
