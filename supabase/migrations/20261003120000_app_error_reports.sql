-- Crash reports from the app (features/system/errorReporting.ts). Anyone with the app's
-- public key can add a report, but nobody can read, change or delete them through the
-- API: read them in the Supabase dashboard. Reports hold no account or device details.

create table if not exists public.app_error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('screen', 'app', 'fatal')),
  message text not null check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  component_stack text check (char_length(component_stack) <= 4000),
  platform text check (char_length(platform) <= 20),
  app_version text check (char_length(app_version) <= 40),
  update_id text check (char_length(update_id) <= 64)
);

alter table public.app_error_reports enable row level security;

revoke all on table public.app_error_reports from anon, authenticated;
grant insert on table public.app_error_reports to anon, authenticated;

drop policy if exists "The app can file error reports" on public.app_error_reports;
create policy "The app can file error reports"
on public.app_error_reports
for insert
to anon, authenticated
with check (true);

create index if not exists app_error_reports_created_at_idx
  on public.app_error_reports (created_at desc);
