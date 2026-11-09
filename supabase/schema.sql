-- MOVINCAM.ART quotation app schema
-- Run this in Supabase SQL Editor.
-- This starter uses a single-owner setup. Enable Supabase Auth and create your owner account.
-- Do not expose the service_role key in the frontend.

create table if not exists public.quotations (
  id text primary key,
  quote_no text not null unique,
  client_name text not null default '',
  status text not null default 'Draft',
  total numeric(12,2) not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotations enable row level security;

-- Replace the email below with the owner's Supabase login email.
-- This policy intentionally limits access to one owner account.
create policy "Owner can manage quotations"
on public.quotations
for all
to authenticated
using (auth.jwt() ->> 'email' = 'kamalmahadevwala09@gmail.com')
with check (auth.jwt() ->> 'email' = 'kamalmahadevwala09@gmail.com');

create index if not exists quotations_created_at_idx
on public.quotations (created_at desc);

-- Note: This starter currently has local-preview mode until Supabase Auth is
-- enabled and an owner login screen is added. Do not leave the table publicly
-- readable. Replace OWNER_EMAIL@example.com before using the database.
