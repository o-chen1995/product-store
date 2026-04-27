do $$ begin
  create type profile_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role profile_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_user_insert on auth.users;
create trigger create_profile_after_user_insert
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- To make a user an admin, replace the email below and run:
-- update public.profiles
-- set role = 'admin'
-- where email = 'you@example.com';

-- If the user existed before this trigger was added, create the profile first:
-- insert into public.profiles (id, email, role)
-- select id, email, 'admin'
-- from auth.users
-- where email = 'you@example.com'
-- on conflict (id) do update set role = 'admin', email = excluded.email;
