alter table public.chapter_link_overrides
  add column if not exists app_link_lesson_id text;

create table if not exists public.admin_content_publishers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_content_publishers enable row level security;
revoke all on table public.admin_content_publishers from anon, authenticated;

create table if not exists public.published_admin_content (
  id text primary key check (id = 'live'),
  version bigint not null default 1 check (version >= 1),
  payload jsonb not null default jsonb_build_object(
    'chapterLinkOverrides', '[]'::jsonb,
    'customChapters', '[]'::jsonb,
    'customVocabularyLessons', '[]'::jsonb
  ),
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);

alter table public.published_admin_content enable row level security;

drop policy if exists "Anyone can read published admin content" on public.published_admin_content;
create policy "Anyone can read published admin content"
on public.published_admin_content
for select
using (true);

grant select on table public.published_admin_content to anon, authenticated;
revoke insert, update, delete on table public.published_admin_content from anon, authenticated;

insert into public.published_admin_content (id, version, payload)
select
  'live',
  1,
  jsonb_build_object(
    'chapterLinkOverrides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'categoryTitle', category_title,
        'lessonTitle', lesson_title,
        'displayTitle', display_title,
        'url', url,
        'appLink', case
          when app_link_target is not null and (app_link_lesson_title is not null or app_link_lesson_id is not null)
          then jsonb_strip_nulls(jsonb_build_object(
            'target', app_link_target,
            'lessonTitle', coalesce(app_link_lesson_title, ''),
            'lessonId', app_link_lesson_id
          ))
          else null
        end,
        'createdAt', created_at,
        'updatedAt', updated_at
      ) order by category_title, lesson_title)
      from public.chapter_link_overrides
    ), '[]'::jsonb),
    'customChapters', '[]'::jsonb,
    'customVocabularyLessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'title', title,
        'description', coalesce(description, ''),
        'imageUrl', coalesce(image_url, ''),
        'category', coalesce(category, 'Custom'),
        'flashcards', flashcards,
        'isCustom', true,
        'createdAt', created_at,
        'updatedAt', updated_at
      ) order by updated_at desc)
      from public.custom_vocabulary_lessons
    ), '[]'::jsonb)
  )
on conflict (id) do nothing;

