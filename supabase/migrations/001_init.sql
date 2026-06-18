-- profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- tags table
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- tasks table
create table public.tasks (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  due_date date,
  due_time text,
  priority text check (priority in ('p1','p2','p3','p4')),
  tags text[] default '{}',
  assignee_id uuid references public.profiles(id),
  creator_id uuid references public.profiles(id),
  reminder text,
  recurrence text check (recurrence in ('daily','weekly','monthly')),
  my_day boolean default false,
  status text not null default 'pending' check (status in ('pending','in_progress','review','completed')),
  project text,
  notified boolean default false,
  logs jsonb default '[]',
  comments jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- alarms table
create table public.alarms (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  trigger_time timestamptz not null,
  label text not null,
  is_recurring boolean default false,
  recurrence_rule text,
  is_active boolean default true,
  status text not null default 'scheduled',
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.projects enable row level security;
alter table public.tags enable row level security;
alter table public.alarms enable row level security;

-- profiles: users read own, admins read all
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- tasks: users see own, admins see all
create policy "tasks_select_own" on public.tasks for select
  using (assignee_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "tasks_insert" on public.tasks for insert with check (creator_id = auth.uid());
create policy "tasks_update" on public.tasks for update
  using (assignee_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "tasks_delete" on public.tasks for delete
  using (creator_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- projects: owner or admin
create policy "projects_all" on public.projects for all
  using (owner_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- tags: owner or admin
create policy "tags_all" on public.tags for all
  using (owner_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- alarms: own only
create policy "alarms_all" on public.alarms for all using (user_id = auth.uid());

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
