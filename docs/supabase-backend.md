# Isra Anwar Supabase Backend

This app now has a Supabase backend adapter with localStorage fallback.

## Apply the database schema

Option A, Supabase CLI:

```sh
supabase login
supabase link --project-ref dhbeonmdphngilxsmvot
supabase db push
```

If `supabase db push` reports `Remote migration versions not found in local migrations directory`,
keep the remote history aligned locally before pushing new migrations. This project includes
placeholder files for the older remote migration versions so the CLI can safely compare local
and remote migration history.

Verify the history with:

```sh
supabase migration list
```

Option B, Supabase Dashboard:

Open Supabase SQL Editor and run:

```text
supabase/migrations/20260806190000_init_israanwar_backend.sql
```

## Create the first admin

1. Open Supabase Dashboard -> Authentication -> Users.
2. Add the admin user.
3. Promote the user to admin in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@israanwar.com';
```

## Push existing browser content to Supabase

1. Login to `/admin/login` using the Supabase admin account.
2. Open `/admin/settings`.
3. Click `Sync local -> Supabase`.

After this, public pages and the admin dashboard will read/write Supabase data first, with localStorage as a fallback.
