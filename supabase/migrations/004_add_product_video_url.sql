-- ============================================================================
-- INTAKHAB Migration 004: Add optional product showcase video URL column
-- Safe, additive, idempotent migration. Does not modify existing rows or RLS.
-- ============================================================================

alter table public.products
  add column if not exists video_url text default '';
