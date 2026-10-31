-- Scaffolded with AI assistance — see AI_USAGE.md
-- Run this in the Supabase SQL editor (already run on the team project, 2026-10-30).
-- Reviews for tickets 09 and 10: one review per reader per book, a required 1-5 rating and an
-- optional caption up to 500 characters. The reviews table is the only home for ratings, so
-- shelf ratings (user_books.rating) are copied in here.
--
-- book_id has no foreign key to books on purpose: most books are only on Google Books, and
-- readers review those too.
begin;

-- 1. one review per reader per book: keep the newest, then forbid duplicates
delete from public.reviews r
using public.reviews newer
where r.user_id = newer.user_id
  and r.book_id = newer.book_id
  and (coalesce(r.created_at, '-infinity'), r.id)
    < (coalesce(newer.created_at, '-infinity'), newer.id);

create unique index if not exists reviews_user_book_key
  on public.reviews (user_id, book_id);

-- 2a. reviews missing stars take them from the shelf
update public.reviews r
set rating = ub.rating
from public.user_books ub
where ub.user_id = r.user_id
  and ub.book_id = r.book_id
  and (r.rating is null or r.rating not between 1 and 5)
  and ub.rating between 1 and 5;

-- 2b. shelf ratings with no review become stars-only reviews
insert into public.reviews (user_id, book_id, rating, created_at)
select distinct on (ub.user_id, ub.book_id)
  ub.user_id, ub.book_id, ub.rating, coalesce(ub.updated_at, now())
from public.user_books ub
where ub.user_id is not null
  and ub.rating between 1 and 5
  and not exists (
    select 1 from public.reviews r
    where r.user_id = ub.user_id and r.book_id = ub.book_id
  )
order by ub.user_id, ub.book_id, ub.updated_at desc nulls last;

-- 3. clean rows that can't meet the new rules
delete from public.reviews
where user_id is null or rating is null or rating not between 1 and 5;

update public.reviews set review_text = null
where review_text is not null and btrim(review_text) = '';

update public.reviews set review_text = left(review_text, 500)
where char_length(review_text) > 500;

update public.reviews set created_at = now() where created_at is null;

-- 4. the rules (REVIEW_MAX in server/src/routes/books.js matches the 500)
alter table public.reviews
  alter column user_id set not null,
  alter column rating set not null,
  alter column created_at set not null;

alter table public.reviews drop constraint if exists reviews_rating_range;
alter table public.reviews add constraint reviews_rating_range
  check (rating between 1 and 5);

alter table public.reviews drop constraint if exists reviews_text_length;
alter table public.reviews add constraint reviews_text_length
  check (review_text is null or char_length(review_text) <= 500);

-- 5. when a review was last edited; the API sets it on every save
alter table public.reviews
  add column if not exists updated_at timestamptz not null default now();

update public.reviews set updated_at = created_at;

-- 6. a book's reviews, newest first
create index if not exists reviews_book_idx
  on public.reviews (book_id, created_at desc);

commit;

-- Afterwards: nothing reads or writes user_books.rating any more, so it can go.
-- alter table public.user_books drop column if exists rating;
