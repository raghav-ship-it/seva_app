-- Helper function: check if current user is admin WITHOUT triggering RLS
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- Fix profiles_select: was self-referencing, causing infinite recursion
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Fix tasks policies
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select
  using (assignee_id = auth.uid() or public.is_admin());

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update
  using (assignee_id = auth.uid() or public.is_admin());

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete
  using (creator_id = auth.uid() or public.is_admin());

-- Fix projects and tags policies
drop policy if exists "projects_all" on public.projects;
create policy "projects_all" on public.projects for all
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "tags_all" on public.tags;
create policy "tags_all" on public.tags for all
  using (owner_id = auth.uid() or public.is_admin());
