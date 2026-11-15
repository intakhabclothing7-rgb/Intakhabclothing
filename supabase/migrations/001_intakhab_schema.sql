-- ============================================================================
-- INTAKHAB — Complete Production-Ready Supabase PostgreSQL Schema,
-- Security Hardening, Inventory/Audit Triggers, RPCs, RLS & Storage Policies
-- Safe & repeatable: preserves existing data (never drops tables or clears rows).
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Shared updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 2. Admin Roles & Permission Helpers (Public registration is blocked)
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_roles_user on public.admin_roles (user_id, is_active);

drop trigger if exists trg_admin_roles_updated_at on public.admin_roles;
create trigger trg_admin_roles_updated_at
before update on public.admin_roles
for each row execute function public.set_updated_at();

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

create or replace function public.is_super_admin()
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
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- 3. Categories & Collections
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  image_url text default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_categories_order on public.categories (display_order asc, created_at asc);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- 4. Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  urdu_name text default '',
  slug text not null unique,
  sku text not null unique,
  description text not null default '',
  price integer not null check (price >= 0),
  sale_price integer check (sale_price is null or sale_price >= 0),
  category text not null default 'New Arrivals',
  material text not null default '',
  colour text not null default '',
  model_specs text not null default '',
  available_sizes text[] not null default array['XS', 'S', 'M', 'L', 'XL'],
  available_colors text[] not null default array[]::text[],
  features text[] not null default array[]::text[],
  care_instructions text[] not null default array[]::text[],
  stock_quantity integer not null default 10 check (stock_quantity >= 0),
  in_stock boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default true,
  is_best_seller boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_active_order on public.products (is_active, display_order asc, created_at desc);
create index if not exists idx_products_slug on public.products (slug);

create or replace function public.sync_product_in_stock()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.stock_quantity <= 0 then
    new.stock_quantity := 0;
    new.in_stock := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_sync_in_stock on public.products;
create trigger trg_products_sync_in_stock
before insert or update of stock_quantity, in_stock on public.products
for each row execute function public.sync_product_in_stock();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- 5. Product Images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text default '',
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_product_images_product on public.product_images (product_id, display_order asc);

-- 6. Product <-> Categories Join Table
create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create index if not exists idx_product_categories_cat on public.product_categories (category_id);

-- 7. Homepage Hero Slider
create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  badge_text text not null default 'THE SIGNATURE COLLECTION',
  title text not null default 'Elegance in Every Stitch',
  urdu_subtitle text default 'انتخاب — ہر انداز میں نفاست',
  description text default '',
  cta_primary_text text not null default 'SHOP THE COLLECTION',
  cta_primary_link text not null default 'collection:All',
  cta_secondary_text text default 'EXPLORE NEW ARRIVALS',
  cta_secondary_link text default '#best-sellers',
  desktop_image_url text not null,
  mobile_image_url text default '',
  transition_ms integer not null default 2500 check (transition_ms >= 800),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_hero_slides_order on public.hero_slides (is_active, display_order asc);

drop trigger if exists trg_hero_slides_updated_at on public.hero_slides;
create trigger trg_hero_slides_updated_at
before update on public.hero_slides
for each row execute function public.set_updated_at();

-- 8. Best Sellers Manual Curated List
create table if not exists public.best_sellers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  custom_title text default '',
  custom_subtitle text default '',
  custom_image_url text default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_best_sellers_order on public.best_sellers (is_active, display_order asc);

drop trigger if exists trg_best_sellers_updated_at on public.best_sellers;
create trigger trg_best_sellers_updated_at
before update on public.best_sellers
for each row execute function public.set_updated_at();

-- 9. Customer Reviews & Append-Only Edit/Moderation/Delete Audit History
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text default '',
  customer_name text not null,
  customer_email text default '',
  city text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  media jsonb not null default '[]'::jsonb,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  is_edited_by_admin boolean not null default false,
  admin_response text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_reviews_status_created on public.reviews (status, created_at desc);
create index if not exists idx_reviews_product on public.reviews (product_id);

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create table if not exists public.review_audit_logs (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete set null,
  review_ref_id uuid,
  edited_by uuid references auth.users(id) on delete set null,
  action_type text not null default 'edit' check (action_type in ('edit', 'status_change', 'delete')),
  customer_name text default '',
  previous_comment text not null,
  new_comment text not null,
  previous_rating integer,
  new_rating integer,
  previous_status text,
  new_status text,
  previous_admin_response text default '',
  new_admin_response text default '',
  action_note text default 'Edited by administrator',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.review_audit_logs alter column review_id drop not null;
alter table public.review_audit_logs add column if not exists review_ref_id uuid;
alter table public.review_audit_logs add column if not exists action_type text not null default 'edit';
alter table public.review_audit_logs add column if not exists customer_name text default '';
alter table public.review_audit_logs add column if not exists previous_status text;
alter table public.review_audit_logs add column if not exists new_status text;
alter table public.review_audit_logs add column if not exists previous_admin_response text default '';
alter table public.review_audit_logs add column if not exists new_admin_response text default '';

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'review_audit_logs_review_id_fkey'
      and conrelid = 'public.review_audit_logs'::regclass
  ) then
    alter table public.review_audit_logs drop constraint review_audit_logs_review_id_fkey;
  end if;
  alter table public.review_audit_logs
    add constraint review_audit_logs_review_id_fkey
    foreign key (review_id) references public.reviews(id) on delete set null;

  if not exists (
    select 1 from pg_constraint
    where conname = 'review_audit_logs_action_type_check'
      and conrelid = 'public.review_audit_logs'::regclass
  ) then
    alter table public.review_audit_logs
      add constraint review_audit_logs_action_type_check
      check (action_type in ('edit', 'status_change', 'delete'));
  end if;
end $$;

update public.review_audit_logs
set review_ref_id = review_id
where review_ref_id is null
  and review_id is not null;

create index if not exists idx_review_audit_review on public.review_audit_logs (review_id, created_at desc);
create index if not exists idx_review_audit_ref on public.review_audit_logs (review_ref_id, created_at desc);

create or replace function public.prevent_review_audit_log_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'review_audit_logs is append-only and audit entries cannot be deleted.';
  end if;

  if tg_op = 'UPDATE' then
    if old.id = new.id
       and old.review_ref_id is not distinct from new.review_ref_id
       and old.action_type is not distinct from new.action_type
       and old.customer_name is not distinct from new.customer_name
       and old.previous_comment is not distinct from new.previous_comment
       and old.new_comment is not distinct from new.new_comment
       and old.previous_rating is not distinct from new.previous_rating
       and old.new_rating is not distinct from new.new_rating
       and old.previous_status is not distinct from new.previous_status
       and old.new_status is not distinct from new.new_status
       and old.previous_admin_response is not distinct from new.previous_admin_response
       and old.new_admin_response is not distinct from new.new_admin_response
       and old.action_note is not distinct from new.action_note
       and old.created_at is not distinct from new.created_at
       and (
         (old.review_id is not null and new.review_id is null and old.edited_by is not distinct from new.edited_by)
         or (old.edited_by is not null and new.edited_by is null and old.review_id is not distinct from new.review_id)
       ) then
      return new;
    end if;

    raise exception 'review_audit_logs is append-only and existing audit entries cannot be modified.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_review_audit_logs_immutable on public.review_audit_logs;
create trigger trg_review_audit_logs_immutable
before update or delete on public.review_audit_logs
for each row execute function public.prevent_review_audit_log_mutation();

create or replace function public.mark_review_admin_edit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.comment is distinct from new.comment or old.rating is distinct from new.rating then
    new.is_edited_by_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reviews_mark_admin_edit on public.reviews;
create trigger trg_reviews_mark_admin_edit
before update on public.reviews
for each row execute function public.mark_review_admin_edit();

create or replace function public.log_review_update_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action text;
  v_note text;
begin
  if old.comment is not distinct from new.comment
     and old.rating is not distinct from new.rating
     and old.status is not distinct from new.status
     and old.admin_response is not distinct from new.admin_response then
    return new;
  end if;

  if old.comment is distinct from new.comment
     or old.rating is distinct from new.rating
     or old.admin_response is distinct from new.admin_response then
    v_action := 'edit';
    v_note := 'Review edited by administrator';
  else
    v_action := 'status_change';
    v_note := 'Moderation status changed (' || coalesce(old.status, '') || ' -> ' || coalesce(new.status, '') || ')';
  end if;

  insert into public.review_audit_logs (
    review_id,
    review_ref_id,
    edited_by,
    action_type,
    customer_name,
    previous_comment,
    new_comment,
    previous_rating,
    new_rating,
    previous_status,
    new_status,
    previous_admin_response,
    new_admin_response,
    action_note
  )
  values (
    new.id,
    new.id,
    auth.uid(),
    v_action,
    new.customer_name,
    old.comment,
    new.comment,
    old.rating,
    new.rating,
    old.status,
    new.status,
    coalesce(old.admin_response, ''),
    coalesce(new.admin_response, ''),
    v_note
  );

  return new;
end;
$$;

drop trigger if exists trg_reviews_audit_update on public.reviews;
create trigger trg_reviews_audit_update
after update on public.reviews
for each row execute function public.log_review_update_audit();

create or replace function public.log_review_delete_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.review_audit_logs (
    review_id,
    review_ref_id,
    edited_by,
    action_type,
    customer_name,
    previous_comment,
    new_comment,
    previous_rating,
    new_rating,
    previous_status,
    new_status,
    previous_admin_response,
    new_admin_response,
    action_note
  )
  values (
    null,
    old.id,
    auth.uid(),
    'delete',
    old.customer_name,
    old.comment,
    '[DELETED]',
    old.rating,
    null,
    old.status,
    'deleted',
    coalesce(old.admin_response, ''),
    '',
    'Review permanently deleted by administrator'
  );
  return old;
end;
$$;

drop trigger if exists trg_reviews_audit_delete on public.reviews;
create trigger trg_reviews_audit_delete
before delete on public.reviews
for each row execute function public.log_review_delete_audit();

-- 10. Homepage Dynamic Content Blocks
create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  badge_text text default '',
  heading text default '',
  subheading text default '',
  description text default '',
  primary_cta_text text default '',
  primary_cta_link text default '',
  secondary_cta_text text default '',
  secondary_cta_link text default '',
  image_url text default '',
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_homepage_content_updated_at on public.homepage_content;
create trigger trg_homepage_content_updated_at
before update on public.homepage_content
for each row execute function public.set_updated_at();

-- 11. Website Settings Singleton
create table if not exists public.website_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'INTAKHAB',
  delivery_fee integer not null default 350 check (delivery_fee >= 0),
  delivery_time_text text not null default '5–7 working days',
  whatsapp_number text not null default '+92 325 6253921',
  instagram_url text not null default 'https://www.instagram.com/intakhab__womens_clothing?utm_source=qr',
  bank_title text not null default 'THE FRAGRANCES POINT',
  bank_name text not null default 'UNITED BANK LTD UBL',
  bank_account_number text not null default '2211367921909',
  jazzcash_number text not null default '03086293355',
  jazzcash_name text not null default 'mazz al rehman',
  announcement_text text not null default 'Resort Collection is LIVE ✦ Nationwide Delivery Rs. 350 PKR · 5–7 Working Days ✦ Bespoke Stitched Tailoring · D.H.A Lahore',
  hero_transition_ms integer not null default 2500 check (hero_transition_ms >= 800),
  best_sellers_limit integer not null default 6 check (best_sellers_limit between 1 and 24),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_website_settings_updated_at on public.website_settings;
create trigger trg_website_settings_updated_at
before update on public.website_settings
for each row execute function public.set_updated_at();

-- 12. Orders, Order Items, Order Status History & Concurrency-Safe Inventory Management
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  idempotency_key text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text default '',
  shipping_address text not null,
  city text not null,
  postal_code text default '',
  notes text default '',
  payment_method text not null default 'cod' check (payment_method in ('cod', 'bank_transfer')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null default 350 check (shipping_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_payment_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('pending', 'paid', 'failed', 'refunded'));
  end if;
end $$;

create index if not exists idx_orders_created on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_payment_status on public.orders (payment_status);
create unique index if not exists idx_orders_idempotency_key
  on public.orders (idempotency_key)
  where idempotency_key is not null;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text default '',
  product_image text default '',
  shirt_size text not null,
  pant_size text not null,
  shirt_length text not null,
  pant_length text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_order_items_product on public.order_items (product_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  new_status text not null check (new_status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  changed_by uuid references auth.users(id) on delete set null,
  note text default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_status_history_order on public.order_status_history (order_id, created_at desc);

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, previous_status, new_status, changed_by, note)
    values (new.id, null, new.status, auth.uid(), 'Order placed');
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.order_status_history (order_id, previous_status, new_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(), 'Status updated');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_log_status on public.orders;
create trigger trg_orders_log_status
after insert or update of status on public.orders
for each row execute function public.log_order_status_change();

create or replace function public.enforce_order_totals_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_items_subtotal integer;
begin
  new.shipping_fee := greatest(0, coalesce(new.shipping_fee, 0));

  if coalesce(current_setting('intakhab.syncing_order_totals', true), 'off') = 'on' then
    new.subtotal := greatest(0, coalesce(new.subtotal, 0));
    new.total := new.subtotal + new.shipping_fee;
    return new;
  end if;

  select coalesce(sum(total_price), 0)::integer
    into v_items_subtotal
  from public.order_items
  where order_id = new.id;

  new.subtotal := v_items_subtotal;
  new.total := v_items_subtotal + new.shipping_fee;
  return new;
end;
$$;

drop trigger if exists trg_orders_enforce_totals on public.orders;
create trigger trg_orders_enforce_totals
before update on public.orders
for each row execute function public.enforce_order_totals_integrity();

create or replace function public.sync_order_item_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_status text;
  v_product public.products%rowtype;
  v_first_pid uuid;
  v_second_pid uuid;
begin
  if new.quantity is null or new.quantity <= 0 then
    raise exception 'Order item quantity must be greater than zero.';
  end if;

  if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id then
    raise exception 'Order items cannot be moved to a different order.';
  end if;

  select status
    into v_order_status
  from public.orders
  where id = new.order_id
  for update;

  if not found then
    raise exception 'Referenced order does not exist.';
  end if;

  if tg_op = 'INSERT' then
    if new.product_id is not null then
      select * into v_product
      from public.products
      where id = new.product_id
      for update;

      if not found then
        raise exception 'Product referenced by order item does not exist.';
      end if;

      new.unit_price := case
        when v_product.sale_price is not null
         and v_product.sale_price > 0
         and v_product.sale_price < v_product.price
        then v_product.sale_price
        else v_product.price
      end;
      new.product_name := coalesce(nullif(trim(new.product_name), ''), v_product.name);
      new.product_sku := coalesce(nullif(trim(new.product_sku), ''), v_product.sku);
    end if;
  elsif tg_op = 'UPDATE' then
    if old.product_id is distinct from new.product_id then
      if old.product_id is not null and new.product_id is not null then
        v_first_pid := least(old.product_id, new.product_id);
        v_second_pid := greatest(old.product_id, new.product_id);
        perform id from public.products where id = v_first_pid for update;
        perform id from public.products where id = v_second_pid for update;
      elsif new.product_id is not null then
        perform id from public.products where id = new.product_id for update;
      end if;

      if new.product_id is not null then
        select * into v_product
        from public.products
        where id = new.product_id;

        if not found then
          raise exception 'Product referenced by order item does not exist.';
        end if;

        new.unit_price := case
          when v_product.sale_price is not null
           and v_product.sale_price > 0
           and v_product.sale_price < v_product.price
          then v_product.sale_price
          else v_product.price
        end;
        new.product_name := v_product.name;
        new.product_sku := v_product.sku;
      else
        new.unit_price := old.unit_price;
      end if;
    else
      new.unit_price := old.unit_price;
      if new.product_id is not null then
        perform id from public.products where id = new.product_id for update;
      end if;
    end if;
  end if;

  new.unit_price := greatest(0, coalesce(new.unit_price, 0));
  new.total_price := new.unit_price * new.quantity;
  return new;
end;
$$;

drop trigger if exists trg_order_items_before_write on public.order_items;
create trigger trg_order_items_before_write
before insert or update on public.order_items
for each row execute function public.sync_order_item_before_write();

-- Strictly branch TG_OP so DELETE never accesses NEW and INSERT never accesses OLD
create or replace function public.handle_order_item_after_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order_status text;
  v_stock integer;
  v_in_stock boolean;
  v_name text;
  v_delta integer;
  v_new_subtotal integer;
begin
  if tg_op = 'DELETE' then
    v_order_id := old.order_id;

    -- Skip cascade deletes triggered by parent order DELETE (already restored once in BEFORE DELETE)
    if position(',' || old.order_id::text || ',' in coalesce(current_setting('intakhab.deleting_orders', true), '')) > 0 then
      return old;
    end if;

    select status
      into v_order_status
    from public.orders
    where id = v_order_id
    for update;

    if v_order_status is not null and v_order_status <> 'cancelled' and old.product_id is not null then
      perform id from public.products where id = old.product_id for update;
      update public.products
      set
        stock_quantity = stock_quantity + old.quantity,
        in_stock = true
      where id = old.product_id;
    end if;

    if v_order_status is not null then
      select coalesce(sum(total_price), 0)::integer
        into v_new_subtotal
      from public.order_items
      where order_id = v_order_id;

      perform set_config('intakhab.syncing_order_totals', 'on', true);
      update public.orders
      set
        subtotal = v_new_subtotal,
        total = v_new_subtotal + shipping_fee
      where id = v_order_id;
      perform set_config('intakhab.syncing_order_totals', 'off', true);
    end if;

    return old;
  end if;

  v_order_id := new.order_id;

  select status
    into v_order_status
  from public.orders
  where id = v_order_id;

  if v_order_status is not null and v_order_status <> 'cancelled' then
    if tg_op = 'INSERT' then
      if new.product_id is not null then
        select stock_quantity, in_stock, name
          into v_stock, v_in_stock, v_name
        from public.products
        where id = new.product_id
        for update;

        if not found then
          raise exception 'Product referenced by order item does not exist.';
        end if;
        if not v_in_stock or v_stock < new.quantity then
          raise exception 'Insufficient stock for "%": only % available.', v_name, coalesce(v_stock, 0);
        end if;

        update public.products
        set
          stock_quantity = stock_quantity - new.quantity,
          in_stock = ((stock_quantity - new.quantity) > 0)
        where id = new.product_id;
      end if;

    elsif tg_op = 'UPDATE' then
      if old.product_id is not distinct from new.product_id then
        if new.product_id is not null and new.quantity <> old.quantity then
          v_delta := new.quantity - old.quantity;
          if v_delta > 0 then
            select stock_quantity, in_stock, name
              into v_stock, v_in_stock, v_name
            from public.products
            where id = new.product_id
            for update;

            if not v_in_stock or v_stock < v_delta then
              raise exception 'Insufficient stock for "%": only % additional unit(s) available.', v_name, coalesce(v_stock, 0);
            end if;

            update public.products
            set
              stock_quantity = stock_quantity - v_delta,
              in_stock = ((stock_quantity - v_delta) > 0)
            where id = new.product_id;
          else
            update public.products
            set
              stock_quantity = stock_quantity + abs(v_delta),
              in_stock = true
            where id = new.product_id;
          end if;
        end if;
      else
        if old.product_id is not null and exists (select 1 from public.products where id = old.product_id) then
          update public.products
          set
            stock_quantity = stock_quantity + old.quantity,
            in_stock = true
          where id = old.product_id;
        end if;

        if new.product_id is not null then
          select stock_quantity, in_stock, name
            into v_stock, v_in_stock, v_name
          from public.products
          where id = new.product_id
          for update;

          if not found then
            raise exception 'Product referenced by order item does not exist.';
          end if;
          if not v_in_stock or v_stock < new.quantity then
            raise exception 'Insufficient stock for "%": only % available.', v_name, coalesce(v_stock, 0);
          end if;

          update public.products
          set
            stock_quantity = stock_quantity - new.quantity,
            in_stock = ((stock_quantity - new.quantity) > 0)
          where id = new.product_id;
        end if;
      end if;
    end if;
  end if;

  if v_order_status is not null then
    select coalesce(sum(total_price), 0)::integer
      into v_new_subtotal
    from public.order_items
    where order_id = v_order_id;

    perform set_config('intakhab.syncing_order_totals', 'on', true);
    update public.orders
    set
      subtotal = v_new_subtotal,
      total = v_new_subtotal + shipping_fee
    where id = v_order_id;
    perform set_config('intakhab.syncing_order_totals', 'off', true);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_items_decrement_stock on public.order_items;
drop trigger if exists trg_order_items_restore_stock_on_delete on public.order_items;
drop trigger if exists trg_order_items_after_change on public.order_items;
create trigger trg_order_items_after_change
after insert or update or delete on public.order_items
for each row execute function public.handle_order_item_after_change();

create or replace function public.adjust_stock_on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shortage record;
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    perform p.id
    from public.products p
    where p.id in (
      select oi.product_id
      from public.order_items oi
      where oi.order_id = new.id
        and oi.product_id is not null
    )
    order by p.id
    for update;

    update public.products p
    set
      stock_quantity = p.stock_quantity + oi.qty,
      in_stock = true
    from (
      select product_id, sum(quantity)::integer as qty
      from public.order_items
      where order_id = new.id
        and product_id is not null
      group by product_id
    ) oi
    where p.id = oi.product_id;

  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    perform p.id
    from public.products p
    where p.id in (
      select oi.product_id
      from public.order_items oi
      where oi.order_id = new.id
        and oi.product_id is not null
    )
    order by p.id
    for update;

    for v_shortage in
      select p.name, p.stock_quantity, p.in_stock, oi.qty
      from (
        select product_id, sum(quantity)::integer as qty
        from public.order_items
        where order_id = new.id
          and product_id is not null
        group by product_id
      ) oi
      join public.products p on p.id = oi.product_id
      order by p.id
    loop
      if not v_shortage.in_stock or v_shortage.stock_quantity < v_shortage.qty then
        raise exception 'Cannot reopen order: insufficient stock for "%" (% available, % required).',
          v_shortage.name, v_shortage.stock_quantity, v_shortage.qty;
      end if;
    end loop;

    update public.products p
    set
      stock_quantity = p.stock_quantity - oi.qty,
      in_stock = ((p.stock_quantity - oi.qty) > 0)
    from (
      select product_id, sum(quantity)::integer as qty
      from public.order_items
      where order_id = new.id
        and product_id is not null
      group by product_id
    ) oi
    where p.id = oi.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_restore_stock_on_cancel on public.orders;
create trigger trg_orders_restore_stock_on_cancel
after update of status on public.orders
for each row execute function public.adjust_stock_on_order_status_change();

create or replace function public.restore_stock_before_order_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform set_config(
    'intakhab.deleting_orders',
    coalesce(current_setting('intakhab.deleting_orders', true), '') || ',' || old.id::text || ',',
    true
  );

  if old.status <> 'cancelled' then
    perform p.id
    from public.products p
    where p.id in (
      select oi.product_id
      from public.order_items oi
      where oi.order_id = old.id
        and oi.product_id is not null
    )
    order by p.id
    for update;

    update public.products p
    set
      stock_quantity = p.stock_quantity + oi.qty,
      in_stock = true
    from (
      select product_id, sum(quantity)::integer as qty
      from public.order_items
      where order_id = old.id
        and product_id is not null
      group by product_id
    ) oi
    where p.id = oi.product_id;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_orders_restore_stock_on_delete on public.orders;
create trigger trg_orders_restore_stock_on_delete
before delete on public.orders
for each row execute function public.restore_stock_before_order_delete();

-- ----------------------------------------------------------------------------
-- 13. SECURE SERVER-PRICED ORDER, ADMIN REVIEW & SANITIZED PUBLIC REVIEW RPCS
-- ----------------------------------------------------------------------------

drop function if exists public.create_public_order(
  text, text, text, text, text, text, text, text, text, integer, integer, integer, jsonb
);
drop function if exists public.create_public_order(
  text, text, text, text, text, text, text, text, text, text, jsonb
);
drop function if exists public.create_public_order(
  text, text, text, text, text, text, text, text, text, jsonb, text, integer, integer, integer
);

create or replace function public.create_public_order(
  p_order_number text,
  p_customer_name text default '',
  p_customer_phone text default '',
  p_customer_email text default '',
  p_shipping_address text default '',
  p_city text default '',
  p_postal_code text default '',
  p_notes text default '',
  p_payment_method text default 'cod',
  p_items jsonb default '[]'::jsonb,
  p_idempotency_key text default null,
  p_subtotal integer default null,
  p_shipping_fee integer default null,
  p_total integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_clean_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_clean_order_number text := left(trim(coalesce(p_order_number, '')), 40);
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_clean_method text;
  v_shipping_fee integer;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_raw_qty integer;
  v_qty integer;
  v_pid uuid;
  v_product public.products%rowtype;
  v_req record;
  v_unit_price integer;
  v_primary_img text;
begin
  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_customer_phone), '') = ''
     or coalesce(trim(p_shipping_address), '') = ''
     or coalesce(trim(p_city), '') = '' then
    raise exception 'Customer name, phone, shipping address, and city are required.';
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Order must contain between 1 and 50 items.';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(coalesce(v_clean_key, trim(p_customer_phone) || ':' || v_clean_order_number))
  );

  if v_clean_key is not null then
    select * into v_existing
    from public.orders
    where idempotency_key = v_clean_key
    limit 1;

    if found then
      return jsonb_build_object(
        'id', v_existing.id,
        'order_number', v_existing.order_number,
        'subtotal', v_existing.subtotal,
        'shipping_fee', v_existing.shipping_fee,
        'total', v_existing.total,
        'deduplicated', true
      );
    end if;
  end if;

  if v_clean_order_number = '' or exists (
    select 1 from public.orders where order_number = v_clean_order_number
  ) then
    loop
      v_clean_order_number := 'IK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit when not exists (select 1 from public.orders where order_number = v_clean_order_number);
    end loop;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_raw_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_raw_qty <= 0 or v_raw_qty > 100 then
      raise exception 'Each item quantity must be between 1 and 100.';
    end if;
  end loop;

  for v_req in
    select
      nullif(item->>'product_id', '')::uuid as pid,
      sum((item->>'quantity')::integer)::integer as total_qty
    from jsonb_array_elements(p_items) as item
    group by nullif(item->>'product_id', '')::uuid
    order by nullif(item->>'product_id', '')::uuid
  loop
    if v_req.pid is null then
      raise exception 'Invalid product reference in checkout cart.';
    end if;

    select * into v_product
    from public.products
    where id = v_req.pid
      and is_active = true
    for update;

    if not found then
      raise exception 'One or more selected products are no longer available.';
    end if;

    if not v_product.in_stock or v_product.stock_quantity < v_req.total_qty then
      raise exception 'Insufficient stock for "%": only % remaining.', v_product.name, v_product.stock_quantity;
    end if;
  end loop;

  select greatest(0, coalesce((select delivery_fee from public.website_settings where id = 1), 350))
    into v_shipping_fee;

  v_clean_method := case when p_payment_method = 'bank_transfer' then 'bank_transfer' else 'cod' end;

  insert into public.orders (
    order_number,
    idempotency_key,
    customer_name,
    customer_phone,
    customer_email,
    shipping_address,
    city,
    postal_code,
    notes,
    payment_method,
    payment_status,
    subtotal,
    shipping_fee,
    total,
    status
  )
  values (
    v_clean_order_number,
    v_clean_key,
    left(trim(p_customer_name), 150),
    left(trim(p_customer_phone), 40),
    left(coalesce(trim(p_customer_email), ''), 160),
    left(trim(p_shipping_address), 400),
    left(trim(p_city), 100),
    left(coalesce(trim(p_postal_code), ''), 30),
    left(coalesce(trim(p_notes), ''), 1000),
    v_clean_method,
    'pending',
    0,
    v_shipping_fee,
    v_shipping_fee,
    'pending'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    v_pid := nullif(v_item->>'product_id', '')::uuid;

    select * into v_product
    from public.products
    where id = v_pid
      and is_active = true;

    v_unit_price := case
      when v_product.sale_price is not null
       and v_product.sale_price > 0
       and v_product.sale_price < v_product.price
      then v_product.sale_price
      else v_product.price
    end;

    select pi.image_url into v_primary_img
    from public.product_images pi
    where pi.product_id = v_product.id
    order by pi.is_primary desc, pi.display_order asc
    limit 1;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      product_sku,
      product_image,
      shirt_size,
      pant_size,
      shirt_length,
      pant_length,
      quantity,
      unit_price,
      total_price
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      coalesce(v_primary_img, v_item->>'product_image', ''),
      left(coalesce(v_item->>'shirt_size', 'M'), 40),
      left(coalesce(v_item->>'pant_size', 'M'), 40),
      left(coalesce(v_item->>'shirt_length', '48(Standard)'), 40),
      left(coalesce(v_item->>'pant_length', '36(Standard)'), 40),
      v_qty,
      v_unit_price,
      v_unit_price * v_qty
    );
  end loop;

  select subtotal, total
    into v_subtotal, v_total
  from public.orders
  where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_clean_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total,
    'deduplicated', false
  );
end;
$$;

revoke all on function public.create_public_order(
  text, text, text, text, text, text, text, text, text, jsonb, text, integer, integer, integer
) from public;
grant execute on function public.create_public_order(
  text, text, text, text, text, text, text, text, text, jsonb, text, integer, integer, integer
) to anon, authenticated;

create or replace function public.get_admin_reviews()
returns setof public.reviews
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: administrator privileges required.';
  end if;

  return query
  select *
  from public.reviews
  order by created_at desc;
end;
$$;

revoke all on function public.get_admin_reviews() from public;
grant execute on function public.get_admin_reviews() to authenticated;

create or replace function public.create_public_review(
  p_product_id uuid default null,
  p_product_name text default '',
  p_customer_name text default '',
  p_customer_email text default '',
  p_city text default '',
  p_rating integer default 5,
  p_comment text default '',
  p_media jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_review_id uuid;
  v_clean_media jsonb := '[]'::jsonb;
  v_media_item jsonb;
  v_url text;
  v_type text;
begin
  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_city), '') = ''
     or coalesce(trim(p_comment), '') = '' then
    raise exception 'Customer name, city, and review comment are required.';
  end if;

  if jsonb_typeof(p_media) = 'array' then
    for v_media_item in select * from jsonb_array_elements(p_media) limit 6
    loop
      v_type := case when v_media_item->>'type' = 'video' then 'video' else 'image' end;
      v_url := trim(coalesce(v_media_item->>'url', ''));
      if v_url ~ '^https://[a-zA-Z0-9.-]+/storage/v1/object/public/intakhab-media/review-uploads/[a-zA-Z0-9._-]+$'
         and v_url !~ '\.\.' then
        v_clean_media := v_clean_media || jsonb_build_array(
          jsonb_build_object(
            'id', left(coalesce(v_media_item->>'id', gen_random_uuid()::text), 64),
            'type', v_type,
            'url', v_url,
            'name', left(coalesce(v_media_item->>'name', ''), 120)
          )
        );
      end if;
    end loop;
  end if;

  insert into public.reviews (
    product_id,
    product_name,
    customer_name,
    customer_email,
    city,
    rating,
    comment,
    media,
    status,
    is_edited_by_admin
  )
  values (
    p_product_id,
    left(coalesce(trim(p_product_name), ''), 160),
    left(trim(p_customer_name), 120),
    left(coalesce(trim(p_customer_email), ''), 160),
    left(trim(p_city), 100),
    least(5, greatest(1, coalesce(p_rating, 5))),
    left(trim(p_comment), 2000),
    v_clean_media,
    'approved',
    false
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.create_public_review(
  uuid, text, text, text, text, integer, text, jsonb
) from public;
grant execute on function public.create_public_review(
  uuid, text, text, text, text, integer, text, jsonb
) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) & LEAST-PRIVILEGE PERMISSIONS
-- ----------------------------------------------------------------------------

alter table public.admin_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;
alter table public.hero_slides enable row level security;
alter table public.best_sellers enable row level security;
alter table public.reviews enable row level security;
alter table public.review_audit_logs enable row level security;
alter table public.homepage_content enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.website_settings enable row level security;

-- Explicit least-privilege grants for every table
revoke all on public.admin_roles from public, anon, authenticated;
grant select, insert, update, delete on public.admin_roles to authenticated;

revoke all on public.categories from public, anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

revoke all on public.product_images from public, anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

revoke all on public.product_categories from public, anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;

revoke all on public.hero_slides from public, anon, authenticated;
grant select on public.hero_slides to anon, authenticated;
grant insert, update, delete on public.hero_slides to authenticated;

revoke all on public.best_sellers from public, anon, authenticated;
grant select on public.best_sellers to anon, authenticated;
grant insert, update, delete on public.best_sellers to authenticated;

revoke all on public.homepage_content from public, anon, authenticated;
grant select on public.homepage_content to anon, authenticated;
grant insert, update, delete on public.homepage_content to authenticated;

revoke all on public.website_settings from public, anon, authenticated;
grant select on public.website_settings to anon, authenticated;
grant insert, update on public.website_settings to authenticated;

revoke all on public.orders from public, anon, authenticated;
grant select, insert, update, delete on public.orders to authenticated;

revoke all on public.order_items from public, anon, authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

revoke all on public.order_status_history from public, anon, authenticated;
grant select on public.order_status_history to authenticated;

revoke all on public.review_audit_logs from public, anon, authenticated;
grant select on public.review_audit_logs to authenticated;

-- Admin Roles
drop policy if exists "Admin roles readable by authorized admins" on public.admin_roles;
create policy "Admin roles readable by authorized admins"
  on public.admin_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Super admins manage admin roles" on public.admin_roles;
drop policy if exists "Super admins insert admin roles" on public.admin_roles;
create policy "Super admins insert admin roles"
  on public.admin_roles for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists "Super admins update admin roles" on public.admin_roles;
create policy "Super admins update admin roles"
  on public.admin_roles for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Super admins delete admin roles" on public.admin_roles;
create policy "Super admins delete admin roles"
  on public.admin_roles for delete
  to authenticated
  using (public.is_super_admin());

-- Categories
drop policy if exists "Public reads active categories" on public.categories;
create policy "Public reads active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Products
drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Product Images
drop policy if exists "Public reads images of active products" on public.product_images;
create policy "Public reads images of active products"
  on public.product_images for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images"
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Product Categories
drop policy if exists "Public reads product category mappings" on public.product_categories;
create policy "Public reads product category mappings"
  on public.product_categories for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

drop policy if exists "Admins manage product category mappings" on public.product_categories;
create policy "Admins manage product category mappings"
  on public.product_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Hero Slides
drop policy if exists "Public reads active hero slides" on public.hero_slides;
create policy "Public reads active hero slides"
  on public.hero_slides for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage hero slides" on public.hero_slides;
create policy "Admins manage hero slides"
  on public.hero_slides for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Best Sellers
drop policy if exists "Public reads active best sellers" on public.best_sellers;
create policy "Public reads active best sellers"
  on public.best_sellers for select
  to anon, authenticated
  using (
    public.is_admin()
    or (
      is_active = true
      and exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
    )
  );

drop policy if exists "Admins manage best sellers" on public.best_sellers;
create policy "Admins manage best sellers"
  on public.best_sellers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Reviews & security_invoker Public View (customer_email excluded from all direct table SELECTs)
drop policy if exists "Public reads approved reviews" on public.reviews;
drop policy if exists "Anon reads approved public reviews" on public.reviews;
drop policy if exists "Admins read all reviews" on public.reviews;
drop policy if exists "Public and customers read approved reviews" on public.reviews;
create policy "Public and customers read approved reviews"
  on public.reviews for select
  to anon, authenticated
  using (status = 'approved' or public.is_admin());

drop policy if exists "Public submits pending reviews" on public.reviews;
drop policy if exists "Admins insert reviews" on public.reviews;
create policy "Admins insert reviews"
  on public.reviews for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews"
  on public.reviews for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete reviews" on public.reviews;
create policy "Admins delete reviews"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());

revoke all on public.reviews from public, anon, authenticated;
grant select (
  id, product_id, product_name, customer_name, city, rating, comment, media,
  status, is_edited_by_admin, admin_response, created_at, updated_at
) on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

create or replace view public.public_reviews
with (security_invoker = true)
as
select
  id,
  product_id,
  product_name,
  customer_name,
  city,
  rating,
  comment,
  media,
  status,
  is_edited_by_admin,
  admin_response,
  created_at,
  updated_at
from public.reviews
where status = 'approved';

revoke all on public.public_reviews from public;
grant select on public.public_reviews to anon, authenticated;

-- Review Audit Logs
drop policy if exists "Admins read and write review audit logs" on public.review_audit_logs;
drop policy if exists "Admins read review audit logs" on public.review_audit_logs;
create policy "Admins read review audit logs"
  on public.review_audit_logs for select
  to authenticated
  using (public.is_admin());

-- Homepage Content
drop policy if exists "Public reads homepage content" on public.homepage_content;
create policy "Public reads homepage content"
  on public.homepage_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage homepage content" on public.homepage_content;
create policy "Admins manage homepage content"
  on public.homepage_content for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Orders, Order Items & Status History (Strictly admin-only direct access)
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

drop policy if exists "Admins manage order status history" on public.order_status_history;
create policy "Admins manage order status history"
  on public.order_status_history for select
  to authenticated
  using (public.is_admin());

-- Website Settings & Non-Payment Public View
-- Note: Direct SELECT on website_settings allows storefront checkout & banner settings to remain compatible
-- with existing select('*') queries, while public_store_settings provides a minimal non-payment view.
drop policy if exists "Public reads website settings" on public.website_settings;
create policy "Public reads website settings"
  on public.website_settings for select
  to anon, authenticated
  using (id = 1 or public.is_admin());

drop policy if exists "Admins manage website settings" on public.website_settings;
drop policy if exists "Admins insert website settings" on public.website_settings;
create policy "Admins insert website settings"
  on public.website_settings for insert
  to authenticated
  with check (id = 1 and public.is_admin());

drop policy if exists "Admins update website settings" on public.website_settings;
create policy "Admins update website settings"
  on public.website_settings for update
  to authenticated
  using (id = 1 and public.is_admin())
  with check (id = 1 and public.is_admin());

create or replace view public.public_store_settings
with (security_invoker = true)
as
select
  store_name,
  delivery_fee,
  delivery_time_text,
  whatsapp_number,
  instagram_url,
  announcement_text,
  hero_transition_ms,
  best_sellers_limit
from public.website_settings
where id = 1;

revoke all on public.public_store_settings from public;
grant select on public.public_store_settings to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 15. SUPABASE STORAGE BUCKET & HARDENED UPLOAD POLICIES (intakhab-media)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'intakhab-media',
  'intakhab-media',
  true,
  31457280,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads intakhab media" on storage.objects;
create policy "Public reads intakhab media"
  on storage.objects for select
  to public
  using (bucket_id = 'intakhab-media');

drop policy if exists "Admins upload intakhab media" on storage.objects;
create policy "Admins upload intakhab media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'intakhab-media' and public.is_admin());

drop policy if exists "Admins update intakhab media" on storage.objects;
create policy "Admins update intakhab media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'intakhab-media' and public.is_admin())
  with check (bucket_id = 'intakhab-media' and public.is_admin());

drop policy if exists "Admins delete intakhab media" on storage.objects;
create policy "Admins delete intakhab media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'intakhab-media' and public.is_admin());

drop policy if exists "Public uploads review media" on storage.objects;
create policy "Public uploads review media"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'intakhab-media'
    and (storage.foldername(name))[1] = 'review-uploads'
    and array_length(storage.foldername(name), 1) = 1
    and name ~ '^review-uploads/[a-zA-Z0-9._-]+$'
    and name !~ '\.\.'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif', 'mp4', 'webm', 'mov')
  );
