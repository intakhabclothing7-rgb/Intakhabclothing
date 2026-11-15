-- ============================================================================
-- INTAKHAB — Safe Migration: Add "Admins delete orders" RLS Policy
-- ============================================================================
-- Preserves all existing tables, data, triggers, foreign keys, and policies.
-- Keeps RLS enabled and customer/non-admin order access completely restricted.
-- Uses existing auth: auth.uid() + public.admin_roles + public.is_admin().
-- ============================================================================

begin;

-- 1. Ensure public.is_admin() authorizes active 'admin' and 'super_admin' users
--    via auth.uid() = public.admin_roles.user_id
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

-- 2. Keep RLS strictly enabled (no existing policies or data modified)
alter table public.orders enable row level security;

-- 3. Add/replace ONLY the DELETE policy for active authenticated admins
drop policy if exists "Admins delete orders" on public.orders;
create policy "Admins delete orders"
  on public.orders
  for delete
  to authenticated
  using (public.is_admin());

commit;
