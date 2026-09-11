# Live admin content

Content Studio lets an authorized Ellie account publish these changes without releasing a new APK:

- title, URL, or in-app target changes for bundled chapters;
- entirely new chapters in an existing or new category;
- custom vocabulary lessons and categories.

The app reads one public, versioned snapshot from Supabase and keeps the last good snapshot offline. It refreshes when the Lessons or Vocabulary screen gains focus and when the app resumes.

## One-time deployment

Apply the database migrations and deploy the authenticated Edge Function from the linked project:

```sh
npx supabase db push
npx supabase functions deploy publish-admin-content
```

No admin PIN secret is used. Publishing requires a valid Ellie account session, and the function authorizes the user server-side.

## Grant your account admin access

Find the account UUID in Supabase Dashboard under **Authentication > Users**, then run this in the SQL Editor:

```sql
insert into public.admin_content_publishers (user_id)
values ('YOUR-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

To revoke access:

```sql
delete from public.admin_content_publishers
where user_id = 'YOUR-AUTH-USER-UUID';
```

Membership is deliberately not readable from the app. Only the Edge Function service role checks it. As an alternative, the function also accepts an Auth user whose `app_metadata.role` is `admin`.

## Admin workflow

1. Open Ellie on desktop web and sign in with the authorized account.
2. Open Settings and tap the version label seven times.
3. Use **Chapter Links**, **New Chapters**, or **Vocabulary**.
4. Save edits locally, then select **Publish Live**.

Publishing replaces the complete live snapshot and increments its version. An optimistic version check prevents an older editor window from overwriting a newer publish. Local drafts are cleared only after Supabase confirms the new snapshot.

## APK behavior

An APK that contains this live-content client can receive future content changes without another APK update. APKs built before this feature still need one final update because they do not know how to render remote custom chapters or stable in-app lesson targets.

The app's Expo update setting may remain disabled: this feature syncs data from Supabase and does not download a new JavaScript bundle.

If a device is offline or Supabase is temporarily unavailable, it uses its last cached snapshot. It receives the new version the next time it reconnects and focuses/resumes the relevant screen.

## Data model

- `published_admin_content`: public read-only row `id = 'live'` containing the atomic JSON payload and version.
- `admin_content_publishers`: private allow-list of Auth user IDs.
- `chapter_link_overrides` and `custom_vocabulary_lessons`: legacy public-read tables kept in sync for older compatible clients.
- `publish-admin-content`: the only live write path exposed to the admin UI; validates the user, version, and payload.

`Copy Build Bundle` remains available as a backup/export and for permanently baking content into a later release.
