-- Newsletter subscription capture (footer + blog post subscribe forms).

-- The app always lowercases/trims the email before it reaches this table
-- (see newsletterPayload in supabaseData.js), so a plain unique constraint
-- on the column is enough to dedupe — and, unlike a `lower(email)`
-- expression index, a plain column constraint is what PostgREST's
-- upsert(onConflict: "email") can actually target.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_status_created_at_idx
  on public.newsletter_subscribers (status, created_at desc);

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe to the newsletter"
on public.newsletter_subscribers for insert
with check (true);

create policy "Staff can manage newsletter subscribers"
on public.newsletter_subscribers for all
using (public.is_staff())
with check (public.is_staff());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication p
      join pg_publication_rel pr on pr.prpubid = p.oid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = 'newsletter_subscribers'
    )
  then
    alter publication supabase_realtime add table public.newsletter_subscribers;
  end if;
end $$;
