-- Readalot schema. Run once on a fresh Supabase project.
-- Already have the old tables? Run the "Migration" block at the bottom instead.

create table profiles (
  id uuid primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  favorite_genres text[] default '{}',
  location_lat double precision,
  location_lng double precision,
  location_name text,
  discoverable boolean default false,
  last_active_at timestamptz,
  created_at timestamptz default now()
);

create table books (
  id text primary key,
  google_books_id text unique,
  isbn text,
  title text not null,
  authors text[] default '{}',
  cover_url text,
  genres text[] default '{}',
  description text,
  publisher text,
  published_date text,
  buy_url text,
  page_count integer,
  ratings_count integer
);

create table user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id text not null,
  status text check (status in ('want_to_read', 'reading', 'read')),
  progress integer default 0,
  rating integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, book_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id text not null,
  rating integer,
  review_text text,
  created_at timestamptz default now(),
  unique (user_id, book_id)
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id text not null,
  quote_text text not null,
  page_number integer,
  created_at timestamptz default now()
);

create table connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  target_user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, target_user_id)
);

create table featured_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  book_id text,
  author text
);

-- T03: quotes a user has saved (heart)
create table saved_quotes (
  user_id uuid not null references profiles(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, quote_id)
);

-- Migration: for a Supabase project created from the earlier schema (safe to re-run)
alter table profiles add column if not exists location_name text;
alter table books add column if not exists buy_url text;
alter table books add column if not exists page_count integer;
alter table books add column if not exists ratings_count integer;
-- one review per user per book (upsert); fails if duplicates exist, delete them first
create unique index if not exists reviews_user_book_key on reviews (user_id, book_id);
create table if not exists saved_quotes (
  user_id uuid not null references profiles(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, quote_id)
);
