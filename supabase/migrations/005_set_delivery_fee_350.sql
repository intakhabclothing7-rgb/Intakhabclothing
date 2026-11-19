-- Migration: Set website_settings.delivery_fee to 350 PKR everywhere (updating legacy 250 default)
-- Safe to run repeatedly in Supabase SQL Editor.

update public.website_settings
set
  delivery_fee = 350,
  announcement_text = regexp_replace(announcement_text, 'Rs\.?\s*250', 'Rs. 350', 'gi'),
  updated_at = timezone('utc', now())
where id = 1
  and (delivery_fee = 250 or announcement_text ~* 'Rs\.?\s*250');
