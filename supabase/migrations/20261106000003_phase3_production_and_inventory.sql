-- =============================================================================
-- FROSTSCALE619 — Phase 3: Production Batches & Append-Only Inventory
-- Multi-tenant SaaS ERP for Tunisian ice manufacturers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Custom enum types for Phase 3
-- -----------------------------------------------------------------------------
create type public.batch_status as enum ('in_progress', 'completed', 'cancelled');
create type public.inventory_movement_type as enum (
  'production_in',
  'dispatch_out',
  'transfer',
  'melt_loss',
  'adjustment'
);

-- -----------------------------------------------------------------------------
-- 2. Production Batches table (Shift manufacturing records)
-- -----------------------------------------------------------------------------
create table public.production_batches (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  facility_id         uuid not null references public.facilities(id) on delete cascade,
  machine_id          uuid not null references public.machines(id) on delete cascade,
  product_id          uuid not null references public.ice_products(id) on delete cascade,
  storage_location_id uuid not null references public.storage_locations(id) on delete cascade,
  batch_number        text not null,
  status              public.batch_status not null default 'in_progress',
  quantity_units      numeric(12, 2) not null default 0,
  total_weight_kg     numeric(12, 3) not null default 0,
  runtime_hours       numeric(6, 2) not null default 0,
  water_meter_m3      numeric(10, 3),
  electricity_kwh     numeric(10, 2),
  notes               text,
  operator_id         uuid not null references public.profiles(id),
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint uq_batch_org_number unique (organization_id, batch_number)
);

alter table public.production_batches enable row level security;

create trigger production_batches_updated_at
  before update on public.production_batches
  for each row execute function public.set_updated_at();

create index idx_batches_org on public.production_batches (organization_id);
create index idx_batches_facility on public.production_batches (organization_id, facility_id);
create index idx_batches_status on public.production_batches (organization_id, status);

-- -----------------------------------------------------------------------------
-- 3. Append-Only Inventory Movements table (Immutable Stock Ledger)
-- -----------------------------------------------------------------------------
create table public.inventory_movements (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  facility_id           uuid not null references public.facilities(id) on delete cascade,
  storage_location_id   uuid not null references public.storage_locations(id) on delete cascade,
  product_id            uuid not null references public.ice_products(id) on delete cascade,
  movement_type         public.inventory_movement_type not null,
  quantity_delta        numeric(12, 2) not null, -- Positive: added to stock; Negative: deducted
  weight_delta_kg       numeric(12, 3) not null,
  reference_batch_id    uuid references public.production_batches(id) on delete set null,
  reference_document_no text,
  reason                text,
  performed_by          uuid not null references public.profiles(id),
  created_at            timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

create index idx_inventory_movements_org on public.inventory_movements (organization_id);
create index idx_inventory_movements_lookup on public.inventory_movements (
  organization_id,
  storage_location_id,
  product_id
);

-- -----------------------------------------------------------------------------
-- 4. Audit Guard: Prevent any UPDATE or DELETE on inventory movements
-- -----------------------------------------------------------------------------
create or replace function public.prevent_inventory_movement_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Les mouvements de stock sont immuables (append-only) et ne peuvent être ni modifiés ni supprimés.';
end;
$$;

create trigger trg_prevent_inventory_movement_mutation
  before update or delete on public.inventory_movements
  for each row execute function public.prevent_inventory_movement_mutation();

-- -----------------------------------------------------------------------------
-- 5. Atomic Batch Completion & Stock Deposit Procedure
-- -----------------------------------------------------------------------------
create or replace function public.complete_production_batch_atomic(
  p_batch_id          uuid,
  p_quantity_units    numeric,
  p_total_weight_kg   numeric,
  p_runtime_hours     numeric,
  p_water_meter_m3    numeric default null,
  p_electricity_kwh   numeric default null,
  p_notes             text default null
)
returns public.production_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.production_batches;
  v_caller_id uuid;
begin
  v_caller_id := (select auth.uid());
  if v_caller_id is null then
    raise exception 'Non authentifié';
  end if;

  -- 1. Fetch batch
  select * into v_batch
  from public.production_batches
  where id = p_batch_id
    and status = 'in_progress';

  if not found then
    raise exception 'Lot de production introuvable ou déjà clôturé.';
  end if;

  -- 2. Verify caller belongs to the organization
  if not exists (
    select 1 from public.organization_members
    where organization_id = v_batch.organization_id
      and user_id = v_caller_id
      and status = 'active'
  ) then
    raise exception 'Accès refusé pour cette organisation.';
  end if;

  -- 3. Update the batch to completed
  update public.production_batches
  set
    status = 'completed',
    quantity_units = p_quantity_units,
    total_weight_kg = p_total_weight_kg,
    runtime_hours = p_runtime_hours,
    water_meter_m3 = p_water_meter_m3,
    electricity_kwh = p_electricity_kwh,
    notes = coalesce(p_notes, notes),
    completed_at = now()
  where id = p_batch_id
  returning * into v_batch;

  -- 4. Atomically insert the corresponding inventory movement
  insert into public.inventory_movements (
    organization_id,
    facility_id,
    storage_location_id,
    product_id,
    movement_type,
    quantity_delta,
    weight_delta_kg,
    reference_batch_id,
    reference_document_no,
    reason,
    performed_by
  ) values (
    v_batch.organization_id,
    v_batch.facility_id,
    v_batch.storage_location_id,
    v_batch.product_id,
    'production_in',
    p_quantity_units,
    p_total_weight_kg,
    v_batch.id,
    v_batch.batch_number,
    'Entrée en stock - Clôture lot de fabrication ' || v_batch.batch_number,
    v_caller_id
  );

  return v_batch;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- ---- production_batches ----
create policy production_batches_select on public.production_batches
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

-- Owners, admins, and operators can create production batches
create policy production_batches_insert on public.production_batches
  for insert to authenticated
  with check (
    public.is_org_member(organization_id, array['owner', 'admin', 'operator']::public.app_role[])
  );

-- Only owners and admins can cancel or modify batches
create policy production_batches_update on public.production_batches
  for update to authenticated
  using (
    public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[])
  )
  with check (
    public.is_org_member(organization_id, array['owner', 'admin']::public.app_role[])
  );

-- ---- inventory_movements ----
create policy inventory_movements_select on public.inventory_movements
  for select to authenticated
  using (organization_id in (select public.get_user_org_ids()));

-- Owners, admins, and operators can insert inventory movements
create policy inventory_movements_insert on public.inventory_movements
  for insert to authenticated
  with check (
    public.is_org_member(organization_id, array['owner', 'admin', 'operator']::public.app_role[])
  );
