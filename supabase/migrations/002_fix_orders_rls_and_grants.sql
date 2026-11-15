-- ============================================================================
-- INTAKHAB — Safe Migration: Fix Orders Permissions, Grants & Admin RLS Policies
-- ============================================================================
-- Safe & non-destructive:
--   - Does NOT disable RLS
--   - Does NOT drop, recreate, or delete any tables or existing data
--   - Does NOT modify product stock or order triggers
--   - Uses the existing Supabase Auth + public.admin_roles + public.is_admin()
-- ============================================================================

begin;

-- 1. Ensure schema usage is granted so authenticated/anon API calls can reach public objects
grant usage on schema public to anon, authenticated;

-- 2. Ensure the existing admin authorization helper function exists & is executable
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 3. Keep Row Level Security strictly ENABLED on all order-related tables
alter table public.admin_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- 4. Fix SQL table-level GRANT privileges (missing DELETE/UPDATE/SELECT grants cause
--    "permission denied for table orders" before RLS policies are even evaluated)
--    Public/anon users have zero direct table access on orders; checkout uses create_public_order RPC.
revoke all on public.orders from public, anon, authenticated;
grant select, insert, update, delete on public.orders to authenticated;

revoke all on public.order_items from public, anon, authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

revoke all on public.order_status_history from public, anon, authenticated;
grant select on public.order_status_history to authenticated;

-- Ensure authenticated admins can read their own role row in admin_roles
grant select on public.admin_roles to authenticated;

-- 5. Enforce strict Admin-only RLS policies on orders (authorized via public.is_admin())
drop policy if exists "Public submits orders" on public.orders;

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins insert orders" on public.orders;
create policy "Admins insert orders"
  on public.orders for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete orders" on public.orders;
create policy "Admins delete orders"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- 6. Enforce strict Admin-only RLS policies on order_items (cascaded on order delete)
drop policy if exists "Public submits order items" on public.order_items;

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins insert order items" on public.order_items;
create policy "Admins insert order items"
  on public.order_items for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins update delete order items" on public.order_items;
create policy "Admins update delete order items"
  on public.order_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete order items" on public.order_items;
create policy "Admins delete order items"
  on public.order_items for delete
  to authenticated
  using (public.is_admin());

-- 7. Enforce strict Admin-only read policy on order_status_history
drop policy if exists "Admins manage order status history" on public.order_status_history;
create policy "Admins manage order status history"
  on public.order_status_history for select
  to authenticated
  using (public.is_admin());

commit;
