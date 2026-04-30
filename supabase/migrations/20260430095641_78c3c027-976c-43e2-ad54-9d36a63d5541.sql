-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  hospital text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, hospital)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'hospital', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Prescriptions log (analytics + history)
create table public.prescriptions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doctor_name text not null default '',
  hospital text not null default '',
  patient_name text not null default '',
  symptoms_count int not null default 0,
  prescriptions_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.prescriptions_log enable row level security;

create policy "Logs readable by authenticated users"
  on public.prescriptions_log for select
  to authenticated
  using (true);

create policy "Users insert own logs"
  on public.prescriptions_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create index prescriptions_log_user_idx on public.prescriptions_log(user_id);
create index prescriptions_log_created_idx on public.prescriptions_log(created_at desc);