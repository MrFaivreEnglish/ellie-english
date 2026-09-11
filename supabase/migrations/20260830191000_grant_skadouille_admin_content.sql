do $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from public.student_profiles
  where lower(username) = lower('skadouille')
  limit 1;

  if target_user_id is null then
    raise exception 'Cannot grant content admin access: Ellie account skadouille was not found';
  end if;

  insert into public.admin_content_publishers (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;
end
$$;
