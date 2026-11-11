-- Run this in Supabase Dashboard → SQL Editor, before deploying the code that needs it.
-- Safe to re-run.

-- Archiving: keep a comment for reference without showing it to visitors.
alter table comments add column if not exists archived_at timestamptz;
alter table comments add column if not exists archive_reason text;

alter table comments drop constraint if exists comments_archive_reason_check;
alter table comments add constraint comments_archive_reason_check
  check (archive_reason is null or archive_reason in ('not-feedback', 'resolved'));

create index if not exists comments_archived_at_idx on comments (archived_at);

-- Extra context for applying feedback. Null on comments left before this migration.
alter table comments add column if not exists viewport_height integer;
alter table comments add column if not exists device_pixel_ratio real;
alter table comments add column if not exists color_theme text;
alter table comments add column if not exists reduced_motion boolean;
alter table comments add column if not exists browser text;
alter table comments add column if not exists browser_version integer;

-- One row each time "Open PR" is pressed.
create table if not exists pr_requests (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments (id) on delete cascade,
  owner_note text not null default '',
  status text not null default 'requested' check (status in ('requested', 'failed')),
  branch text not null,
  session_url text,
  created_at timestamptz not null default now()
);

create index if not exists pr_requests_comment_id_idx on pr_requests (comment_id);
create index if not exists pr_requests_created_at_idx on pr_requests (created_at);

-- Only one live request per comment, so a double click can't start two runs.
create unique index if not exists pr_requests_one_active_idx
  on pr_requests (comment_id)
  where status = 'requested';

-- Rate limits that hold across serverless instances.
create table if not exists admin_rate_events (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_rate_events_key_idx on admin_rate_events (key, created_at);

-- These tables are only reached with the service role key, never from the browser.
alter table pr_requests enable row level security;
alter table admin_rate_events enable row level security;
