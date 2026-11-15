-- INTAKHAB — Initial Settings, Storefront Content, Categories & Super Admin Setup
-- Non-destructive & safe to run repeatedly; contains NO fictional products, reviews, orders, or stock quantities.

-- 1. Seed Website Settings
insert into public.website_settings (
  id, store_name, delivery_fee, delivery_time_text, whatsapp_number, instagram_url,
  bank_title, bank_name, bank_account_number, jazzcash_number, jazzcash_name,
  announcement_text, hero_transition_ms, best_sellers_limit
)
values (
  1,
  'INTAKHAB',
  350,
  '5–7 working days',
  '+92 325 6253921',
  'https://www.instagram.com/intakhab__womens_clothing?utm_source=qr',
  'THE FRAGRANCES POINT',
  'UNITED BANK LTD UBL',
  '2211367921909',
  '03086293355',
  'mazz al rehman',
  'Resort Collection is LIVE ✦ Nationwide Delivery Rs. 350 PKR · 5–7 Working Days ✦ Bespoke Stitched Tailoring',
  2500,
  6
)
on conflict (id) do nothing;

-- 2. Seed Homepage Content Blocks
insert into public.homepage_content (
  section_key, badge_text, heading, subheading, description,
  primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, image_url
)
values
(
  'new_arrivals_header',
  '',
  'NEW ARRIVAL',
  'Stitched Festive & Luxury Pret Edit',
  '',
  'VIEW ALL',
  'collection:All',
  '',
  '',
  ''
),
(
  'editorial_showcase',
  'NEW SEASON COLLECTION',
  'Elegance in Every Thread',
  'AS SEEN ON',
  'Discover timeless styles, beautiful details, and outfits designed to make every moment special.',
  'EXPLORE COLLECTION',
  'collection:All',
  'Follow @intakhab__womens_clothing',
  'https://www.instagram.com/intakhab__womens_clothing?utm_source=qr',
  ''
),
(
  'best_sellers_header',
  '',
  'BEST SELLERS',
  '',
  '',
  'View all',
  'collection:Best Sellers',
  '',
  '',
  ''
)
on conflict (section_key) do nothing;

-- 3. Seed Storefront Categories (no fictional products or invented stock)
insert into public.categories (name, slug, description, display_order, is_active)
values
  ('New Arrivals', 'new-arrivals', 'Latest ready-to-wear luxury stitched arrivals.', 1, true),
  ('Best Sellers', 'best-sellers', 'Most requested Intakhab co-ord silhouettes.', 2, true),
  ('Luxury Pret', 'luxury-pret', 'Refined everyday and evening tailored sets.', 3, true),
  ('Festive Collection', 'festive-collection', 'Crafted festive couture & silk ensembles.', 4, true)
on conflict (slug) do nothing;

-- 4. Assign super_admin role to intakhabclothing7@gmail.com (requires user to exist in auth.users)
do $$
declare
  v_user_id uuid;
  v_email constant text := 'intakhabclothing7@gmail.com';
begin
  select id
    into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    raise exception 'Supabase Auth user "%" was not found in auth.users. Create this user in Supabase Dashboard -> Authentication -> Users first, then re-run this script.', v_email
      using hint = 'No UUID was invented. Add intakhabclothing7@gmail.com under Authentication -> Users and run again.';
  end if;

  delete from public.admin_roles
  where lower(email) = lower(v_email)
    and user_id <> v_user_id;

  insert into public.admin_roles (user_id, email, role, is_active)
  values (v_user_id, lower(v_email), 'super_admin', true)
  on conflict (user_id) do update
    set email = excluded.email,
        role = 'super_admin',
        is_active = true;
end $$;
