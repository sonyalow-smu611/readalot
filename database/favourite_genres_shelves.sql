-- Favourite genres are the library's genre bookcases, and nothing else.
-- Run this once in the Supabase SQL editor, AFTER the app that offers only these genres is live.
-- (Run it first and a reader on the old page saving "Classic" would be refused.)
--
-- 1. Every profile's saved genres are turned into bookcase names. Older names are mapped
--    (Science Fiction -> Sci-Fi, Mystery and Thriller -> Mystery & Thriller, Memoir -> Memoir,
--    History -> Historical Fiction, Magical Realism -> Fantasy); names with no bookcase (Classic,
--    Literary Fiction, Non-fiction, Self-Help, Poetry, Fiction) are dropped. The order is kept and
--    nothing is listed twice. This mapping is the same as ALIASES in client/src/lib/genreShelves.js.
-- 2. The column then only accepts those bookcase names, so a profile can't hold anything else.
--
-- The bookcases (client/src/buildings/library/categories.js, without Bestsellers):
--   Romance, Romantasy, Fantasy, Mystery & Thriller, Horror, Sci-Fi, Historical Fiction,
--   Young Adult, Memoir, Graphic Novels
-- Adding a bookcase to the library means adding its name to the list in step 2 too.

-- 1. Turn what is saved into bookcase names.
update public.profiles p
set favorite_genres = coalesce((
  select array_agg(shelf order by first_at)
  from (
    select shelf, min(pos) as first_at
    from (
      select
        case regexp_replace(lower(trim(g)), '[^a-z0-9]+', ' ', 'g')
          when 'romance' then 'Romance'
          when 'romantasy' then 'Romantasy'
          when 'fantasy' then 'Fantasy'
          when 'magical realism' then 'Fantasy'
          when 'mystery' then 'Mystery & Thriller'
          when 'thriller' then 'Mystery & Thriller'
          when 'mystery thriller' then 'Mystery & Thriller'
          when 'horror' then 'Horror'
          when 'sci fi' then 'Sci-Fi'
          when 'science fiction' then 'Sci-Fi'
          when 'historical fiction' then 'Historical Fiction'
          when 'history' then 'Historical Fiction'
          when 'young adult' then 'Young Adult'
          when 'young adult fiction' then 'Young Adult'
          when 'memoir' then 'Memoir'
          when 'biography' then 'Memoir'
          when 'memoir biography' then 'Memoir'
          when 'graphic novels' then 'Graphic Novels'
          when 'graphic novel' then 'Graphic Novels'
          when 'graphic novels manga' then 'Graphic Novels'
          else null
        end as shelf,
        pos
      from unnest(p.favorite_genres) with ordinality as t(g, pos)
    ) named
    where shelf is not null
    group by shelf
  ) ordered
), '{}')
where p.favorite_genres is not null;

-- 2. Keep the column to the bookcases.
alter table public.profiles drop constraint if exists profiles_favorite_genres_known;
alter table public.profiles
  add constraint profiles_favorite_genres_known
  check (
    favorite_genres <@ array[
      'Romance', 'Romantasy', 'Fantasy', 'Mystery & Thriller', 'Horror', 'Sci-Fi',
      'Historical Fiction', 'Young Adult', 'Memoir', 'Graphic Novels'
    ]::text[]
  );

-- To see what changed: select username, favorite_genres from public.profiles order by username;
