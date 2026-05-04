-- migrations/001_leads_table.sql
-- Run this once in Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Creates the `public.leads` table that the Google Ads landing page
-- (and any future top-of-funnel form) writes into via /api/contact.
-- Distinct from `public.intakes`, which is for full project briefs after
-- a client has already paid / committed.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null     default now(),

  -- Lead content (what the visitor typed)
  name            text        not null,
  email           text        not null,
  business        text,
  industry        text,
  message         text,        -- "what do you need" (free text)

  -- Where the lead came from
  source          text        not null default 'google_ads_lp',
  landing_page    text,
  page_url        text,
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,

  -- Admin workflow
  status          text        not null default 'new'
                                       check (status in ('new','reviewed','archived')),
  admin_notes     text
);

-- Hot indexes for the admin dashboard list + filter
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_source_idx     on public.leads (source);

-- RLS: lock down. Server-side code uses the service-role key
-- (which bypasses RLS by design); the admin dashboard goes through
-- /api/admin/leads which authenticates the JWT before reading.
alter table public.leads enable row level security;

-- No policies = no anon/auth role can read or write. Only service-role bypasses RLS.
-- (Mirrors how `public.intakes` is locked down today.)
