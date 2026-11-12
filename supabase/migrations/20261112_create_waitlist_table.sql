-- Migration: 20261112_create_waitlist_table.sql
-- Create waitlist table with strict RLS and unique email constraint

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  country text,
  track text,
  priorities text[],
  consent boolean not null,
  consent_at timestamptz not null default now(),
  consent_text_version text not null default 'v1',
  source text
);

-- Unique index on lowercase email to prevent duplicate signups (case-insensitive)
create unique index if not exists waitlist_lower_email_idx on public.waitlist (lower(email));

-- Enable Row Level Security (RLS)
alter table public.waitlist enable row level security;

-- Strict Security:
-- The public must NEVER be able to read, select, update, or delete rows from the waitlist table.
-- Only the service-role client (server-side) can access and insert waitlist records.
-- Do NOT create any public SELECT, UPDATE, or DELETE policies.

-- Note: Optional insert-only policy for anon client if direct client submission is needed:
-- create policy "Allow anon insert with explicit consent" on public.waitlist
--   for insert to anon
--   with check (consent = true);
