delete from public.custom_vocabulary_lessons
where id = 'custom-1779646902691';

update public.published_admin_content
set
  version = version + 1,
  payload = jsonb_set(
    payload,
    '{customVocabularyLessons}',
    coalesce(
      (
        select jsonb_agg(lesson)
        from jsonb_array_elements(coalesce(payload -> 'customVocabularyLessons', '[]'::jsonb)) as lesson
        where lesson ->> 'id' <> 'custom-1779646902691'
      ),
      '[]'::jsonb
    )
  ),
  published_at = now()
where id = 'live'
  and exists (
    select 1
    from jsonb_array_elements(coalesce(payload -> 'customVocabularyLessons', '[]'::jsonb)) as lesson
    where lesson ->> 'id' = 'custom-1779646902691'
  );
