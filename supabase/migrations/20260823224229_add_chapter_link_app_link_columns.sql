create table if not exists public.chapter_link_overrides (
  id text primary key,
  category_title text not null,
  lesson_title text not null,
  display_title text not null,
  url text not null,
  app_link_target text,
  app_link_lesson_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chapter_link_overrides enable row level security;

drop policy if exists "Anyone can read chapter link overrides" on public.chapter_link_overrides;
create policy "Anyone can read chapter link overrides"
on public.chapter_link_overrides
for select
using (true);

alter table public.chapter_link_overrides
  add column if not exists app_link_target text,
  add column if not exists app_link_lesson_title text;

create table if not exists public.custom_vocabulary_lessons (
  id text primary key,
  title text not null,
  description text,
  image_url text,
  category text,
  flashcards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_vocabulary_lessons enable row level security;

drop policy if exists "Anyone can read custom vocabulary lessons" on public.custom_vocabulary_lessons;
create policy "Anyone can read custom vocabulary lessons"
on public.custom_vocabulary_lessons
for select
using (true);
