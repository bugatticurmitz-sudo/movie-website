-- Run once in Supabase SQL Editor to enable Creator's Movies comments.
create table if not exists public.creator_comments (
  id bigint generated always as identity primary key,
  movie_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists creator_comments_movie_created_idx on public.creator_comments(movie_id,created_at desc);
create index if not exists creator_comments_user_idx on public.creator_comments(user_id);
alter table public.creator_comments enable row level security;
grant select on public.creator_comments to anon, authenticated;
grant insert, delete on public.creator_comments to authenticated;
grant usage, select on sequence public.creator_comments_id_seq to authenticated;
drop policy if exists "Everyone can read creator comments" on public.creator_comments;
create policy "Everyone can read creator comments" on public.creator_comments for select to anon, authenticated using (true);
drop policy if exists "Users can post their own creator comments" on public.creator_comments;
create policy "Users can post their own creator comments" on public.creator_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own creator comments" on public.creator_comments;
create policy "Users can delete their own creator comments" on public.creator_comments for delete to authenticated using (auth.uid() = user_id);
