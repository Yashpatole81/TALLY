-- Tally initial schema.
-- Security model:
--   * Row Level Security on every table: a user can only see and change their own rows (auth.uid()).
--   * Primary keys are (user_id, id), so client-chosen IDs can't collide with another user's rows.
--   * CHECK constraints mirror the client-side validation limits (the client checks are UX only).
--   * Explicit, minimal grants: anon gets nothing. Authenticated gets select/insert/update (deletes are soft).

-- --------------------------------------------------------------------------- helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The server clock is the sync cursor. Client-sent values are always replaced.
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_path text check (avatar_path is null or (char_length(avatar_path) <= 200 and avatar_path like id::text || '/%')),
  currency text not null default 'INR' check (currency in ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD')),
  monthly_salary_minor bigint not null default 0 check (monthly_salary_minor between 0 and 10000000000),
  salary_rule text not null default 'last_working_day' check (salary_rule in ('last_working_day', 'custom_date')),
  salary_day smallint check (salary_day between 1 and 31),
  budget_allocation text not null default 'following_month' check (budget_allocation in ('following_month', 'same_month')),
  notifications_enabled boolean not null default true,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_date_needs_day check (salary_rule <> 'custom_date' or salary_day is not null)
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No delete policy: a profile goes away only with its auth user (on delete cascade).

create trigger profiles_updated_at before insert or update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row at sign-up. security definer is needed to write to public.profiles from
-- the auth trigger. search_path is pinned, and RPC access is revoked below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------- savings goals

create table public.savings_goals (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  target_minor bigint check (target_minor is null or target_minor between 1 and 10000000000),
  target_month text check (target_month is null or target_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  contribution_mode text not null default 'fixed' check (contribution_mode in ('fixed', 'auto')),
  fixed_monthly_minor bigint check (fixed_monthly_minor is null or fixed_monthly_minor between 1 and 10000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

alter table public.savings_goals enable row level security;

create policy "goals: read own" on public.savings_goals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "goals: insert own" on public.savings_goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goals: update own" on public.savings_goals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Deletes are soft (deleted_at) so they sync. There is no hard-delete policy or grant.

create trigger savings_goals_updated_at before insert or update on public.savings_goals
  for each row execute function public.set_updated_at();
create index savings_goals_sync_idx on public.savings_goals (user_id, updated_at);

-- --------------------------------------------------------------------------- transactions

create table public.transactions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  type text not null check (type in ('expense', 'income', 'savings')),
  kind text not null default 'manual' check (kind in ('manual', 'salary', 'savings_contribution')),
  amount_minor bigint not null check (amount_minor between 1 and 10000000000),
  category text check (category is null or category in ('food', 'bills', 'shopping', 'travel', 'other')),
  source text check (source is null or source in ('salary', 'freelance', 'bonus', 'refund', 'gift', 'other')),
  note text check (note is null or char_length(note) <= 60),
  goal_id uuid,
  occurred_on date not null,
  budget_month text not null check (budget_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id),
  -- A transaction can only reference the same user's goal.
  foreign key (user_id, goal_id) references public.savings_goals (user_id, id),
  constraint savings_have_goal check (type <> 'savings' or goal_id is not null)
);

alter table public.transactions enable row level security;

create policy "transactions: read own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions: insert own" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions: update own" on public.transactions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create trigger transactions_updated_at before insert or update on public.transactions
  for each row execute function public.set_updated_at();
create index transactions_sync_idx on public.transactions (user_id, updated_at);
create index transactions_month_idx on public.transactions (user_id, budget_month);

-- --------------------------------------------------------------------------- grants

revoke all on public.profiles, public.savings_goals, public.transactions from anon, authenticated;
grant select, insert, update on public.profiles, public.savings_goals, public.transactions to authenticated;

-- Trigger functions aren't API endpoints.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- --------------------------------------------------------------------------- avatars (Storage)

-- Private bucket: images are served only through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects must live under "<user id>/…", and only that user can read or write them.
drop policy if exists "avatars: read own" on storage.objects;
create policy "avatars: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: upload own" on storage.objects;
create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: update own" on storage.objects;
create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
