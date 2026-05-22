# Supabase optional accounts

The app supports optional personal accounts for syncing XP between devices. Guest mode still works without Supabase.

Students see a simple username/password form. The username is the stable login name. The visible account display name starts as the username and can be edited later from the account screen. Internally, the app turns usernames into private Supabase auth emails like:

```txt
username@ellie-students.example.com
```

## Supabase setup

1. Create a Supabase project in an EU region.
2. In `Authentication > Providers > Email`, enable email/password signups.
3. In `Authentication > Sign In / Providers > Email`, disable email confirmations for this username-only setup.
   If email confirmation stays enabled, Supabase tries to send confirmation emails to the hidden technical addresses and may show `email rate limit exceeded`.
4. Open `SQL Editor` and run:

```sql
create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;

drop policy if exists "Students can read own profile" on public.student_profiles;
create policy "Students can read own profile"
on public.student_profiles
for select
using (auth.uid() = id);

drop policy if exists "Students can create own profile" on public.student_profiles;
create policy "Students can create own profile"
on public.student_profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Students can update own profile" on public.student_profiles;
create policy "Students can update own profile"
on public.student_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.validate_student_profile_names()
returns trigger
language plpgsql
as $$
declare
  safe_username text := regexp_replace(lower(coalesce(new.username, '')), '[^a-z0-9]+', '', 'g');
  safe_display_name text := regexp_replace(lower(coalesce(new.display_name, '')), '[^a-z0-9]+', '', 'g');
  blocked_term text;
  blocked_terms text[] := array[
    'asshole', 'bastard', 'batard', 'bitch', 'branleur', 'connard', 'connasse',
    'cunt', 'dick', 'encule', 'fdp', 'fuck', 'hitler', 'merde', 'nazi',
    'petasse', 'putain', 'salaud', 'salope', 'shit', 'slut', 'tamere', 'whore'
  ];
begin
  if new.username !~ '^[a-z0-9._-]{3,32}$' then
    raise exception 'Username is not allowed';
  end if;

  if length(btrim(new.display_name)) < 1 or length(btrim(new.display_name)) > 40 then
    raise exception 'Name is not allowed';
  end if;

  foreach blocked_term in array blocked_terms loop
    if safe_username like '%' || blocked_term || '%' or safe_display_name like '%' || blocked_term || '%' then
      raise exception 'Name is not allowed';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists validate_student_profile_names_trigger on public.student_profiles;
create trigger validate_student_profile_names_trigger
before insert or update of username, display_name
on public.student_profiles
for each row
execute function public.validate_student_profile_names();

create table if not exists public.student_progress_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('grammar_correct', 'vocab_learnt', 'timer_best', 'achievement')),
  item_key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, type, item_key)
);

alter table public.student_progress_items enable row level security;

drop policy if exists "Students can read own progress items" on public.student_progress_items;
create policy "Students can read own progress items"
on public.student_progress_items
for select
using (auth.uid() = user_id);

drop policy if exists "Students can create own progress items" on public.student_progress_items;
create policy "Students can create own progress items"
on public.student_progress_items
for insert
with check (auth.uid() = user_id);

drop policy if exists "Students can update own progress items" on public.student_progress_items;
create policy "Students can update own progress items"
on public.student_progress_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Students can delete own progress items" on public.student_progress_items;
create policy "Students can delete own progress items"
on public.student_progress_items
for delete
using (auth.uid() = user_id);
```

5. To let signed-in students delete their online account from inside the app, run this too:

```sql
create or replace function public.delete_current_student_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_student_account() from public;
grant execute on function public.delete_current_student_account() to authenticated;
```

Deleting the auth user also deletes that student's `student_profiles` row and `student_progress_items` rows because both tables use `on delete cascade`.

6. Copy your project URL and anon public key from `Project Settings > API`.
7. Start Expo with those values:

```powershell
$env:EXPO_PUBLIC_SUPABASE_URL = "https://your-project-ref.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY = "your-anon-public-key"
npm run web
```

For mobile testing, use the same hosted Supabase URL and run `npm start`.

## App behavior

- No account is required.
- XP is always saved locally on the device first.
- Vocabulary learnt cards, grammar saved answers, timer bests, and Shiny Ellie unlocks are also saved locally on the device first.
- Account preferences are also backed up: theme, practice modes, language, haptics, Today card, avatar, and avatar colour.
- The visible account display name is saved in the online profile. Changing it does not change the username used to log in.
- Creating an account starts a fresh online progress record. It does not copy XP or unlocks left on the shared device.
- Signing in loads the account's online XP onto the device.
- Signing in only merges local work when that local work is already marked as belonging to the same signed-in account.
- Signing in applies the account's saved preferences when they exist. If the account has no saved preferences yet, the current device preferences are uploaded.
- Signing into a different account does not copy the device's previous XP, unlocked achievements, or saved work into that account.
- Signing out restores the device progress that existed before login. If there was no previous device progress, the device looks empty. The online copy stays in Supabase.
- Reset saved work clears XP, grammar answers, learnt vocabulary cards, timer bests, and the hidden unlock state. If signed in, the online copy for that account is reset too.
- Deleting an online account removes the Supabase account and cloud profile. Local progress stays on the device.

## Sync status

The account panel shows simple states:

- Saved on this device: work is available without an account.
- Online copy saved: work was synced to Supabase.
- Saving an online copy: sync is running.
- Backup did not work: the student can tap Try again.

When progress belongs to the same signed-in account, the app keeps the biggest XP number, combines saved grammar answers and learnt words, and keeps the fastest timer records.
While signed in, XP, saved grammar answers, learnt vocabulary cards, timer records, Shiny Ellie progress, avatar choices, and settings changes are saved online automatically for that account. The Sync button still exists as a manual retry/full backup action.

## Password recovery

These accounts use fake technical emails, so normal email reset links do not work for students.

For now, password recovery should be handled by the teacher. Supabase does not show the student's current password; passwords are protected. You can set a new password instead.

1. Open Supabase.
2. Go to `Authentication > Users`.
3. Find the student by the hidden email, for example `username@ellie-students.example.com`.
4. Set a new password from the Supabase Dashboard if the option is available, or use a teacher-only server/Edge Function that calls the Supabase Admin API.
5. Tell the student their new password.

The app tells students to ask their teacher if they forget their password.

Do not put a Supabase `service_role` key inside the app. A teacher reset tool must run on a server or trusted Edge Function.

## Teacher password reset tool

This repo includes a separate teacher-only page:

```txt
tools/teacher-reset/index.html
```

It calls this Supabase Edge Function:

```txt
supabase/functions/teacher-reset-password/index.ts
```

The page asks for:

- Supabase project URL
- teacher code
- student username
- new password

The page does not contain the Supabase admin key. The Edge Function uses the protected Supabase service role secret on the server side.

### Deploy the Edge Function

Run these commands from the project folder:

```powershell
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase secrets set TEACHER_RESET_SECRET="choose-a-private-teacher-code"
npx supabase functions deploy teacher-reset-password --no-verify-jwt
```

Use the project ref from your Supabase URL. For example:

```txt
https://wretggbpaejzjdilemit.supabase.co
```

has this project ref:

```txt
wretggbpaejzjdilemit
```

`--no-verify-jwt` is used so the separate teacher page can call the function without putting a Supabase anon key in the page. The function is still protected by `TEACHER_RESET_SECRET`.

### Use the teacher page

Open:

```txt
tools/teacher-reset/index.html
```

Fill in:

```txt
Supabase project URL: https://your-project-ref.supabase.co
Teacher code: the private code you set with TEACHER_RESET_SECRET
Student username: the student account name
New password: the new password to give the student
```

After reset, the student logs in with the same username and the new password.

If a student learns the teacher code, change it:

```powershell
npx supabase secrets set TEACHER_RESET_SECRET="new-private-teacher-code"
npx supabase functions deploy teacher-reset-password --no-verify-jwt
```

## Email rate limit exceeded

This means Supabase is sending auth emails. For username-only student accounts:

1. Go to `Authentication > Sign In / Providers > Email`.
2. Turn off email confirmation.
3. Save.
4. Wait for the email rate limit to reset, then try again.

On the hosted Supabase email service, email sending is rate-limited. You do not need those emails for this setup because students are not using real email addresses.
