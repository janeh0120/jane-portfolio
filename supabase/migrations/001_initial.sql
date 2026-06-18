-- Run this in Supabase Dashboard → SQL Editor (once per project).

create extension if not exists "pgcrypto";

create table if not exists portfolio_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'live',
  deploy_url text,
  git_sha text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid references portfolio_versions (id) on delete set null,
  page_url text not null,
  selector text not null,
  element_label text not null,
  element_display_name text,
  category text not null default '',
  comment text not null,
  device_type text not null,
  os text not null,
  viewport_width integer not null default 0,
  scroll_y integer not null default 0,
  visitor_id text,
  created_at timestamptz not null default now()
);

create table if not exists comment_upvotes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments (id) on delete cascade,
  voter_fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, voter_fingerprint)
);

create index if not exists comments_version_id_idx on comments (version_id);
create index if not exists comments_page_url_idx on comments (page_url);
create index if not exists comment_upvotes_comment_id_idx on comment_upvotes (comment_id);

-- Default live version (safe to re-run).
insert into portfolio_versions (label, is_active)
select 'live', true
where not exists (select 1 from portfolio_versions where is_active = true);
