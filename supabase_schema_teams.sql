
-- 1. Tables Definition

-- Projects Table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  leader_id uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Teams Table
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  activity_id uuid references activities(id) on delete set null,
  project_id uuid references projects(id) on delete cascade,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references profiles(id) on delete set null,
  strategy text,
  resources jsonb default '[]'::jsonb
);

-- Team Members table
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  member_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('member', 'admin', 'lead')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, member_id)
);

-- Project Members table
create table if not exists project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  member_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('member', 'admin')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, member_id)
);


-- 2. Helper Functions (Security Definer) to break RLS Recursion
-- These bypass RLS and prevent "teams -> team_members -> teams" loops.

-- Check if a team is public
create or replace function public.is_team_public(t_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from teams where id = t_id and is_public = true);
end; $$;

-- Check if a user is the team creator/owner
create or replace function public.is_team_owner(t_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from teams where id = t_id and created_by = u_id);
end; $$;

-- Check if a user is a member
create or replace function public.is_team_member(t_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from team_members where team_id = t_id and member_id = u_id);
end; $$;

-- Check if a user has admin/lead privileges
create or replace function public.can_admin_team(t_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (
    select 1 from teams where id = t_id and created_by = u_id
  ) OR exists (
    select 1 from team_members where team_id = t_id and member_id = u_id and role in ('admin', 'lead')
  );
end; $$;

-- 3. Enable RLS
alter table teams enable row level security;
alter table team_members enable row level security;

-- 4. Policies

-- Teams Policies (Consolidated)
drop policy if exists "View teams" on teams;
create policy "View teams" on teams for select using (
  is_public = true 
  OR created_by = auth.uid()
  OR public.is_team_member(id, auth.uid())
);

drop policy if exists "Update teams" on teams;
create policy "Update teams" on teams for update using (
  public.can_admin_team(id, auth.uid())
);

-- Team Members Policies (FOCUS AREA)
drop policy if exists "View team members" on team_members;
create policy "View team members" on team_members for select using (
  auth.role() = 'authenticated'
);

drop policy if exists "Add team members" on team_members;
create policy "Add team members" on team_members for insert with check (
  -- 1. Self-join public team
  (auth.uid() = member_id AND public.is_team_public(team_id))
  OR 
  -- 2. Admin adding members
  public.can_admin_team(team_id, auth.uid())
);

drop policy if exists "Remove team members" on team_members;
create policy "Remove team members" on team_members for delete using (
  -- 1. Self-leave
  auth.uid() = member_id 
  OR 
  -- 2. Admin removing members
  public.can_admin_team(team_id, auth.uid())
);

-- Project Members
drop policy if exists "View project members" on project_members;
create policy "View project members" on project_members for select using (auth.role() = 'authenticated');

drop policy if exists "Add project members" on project_members;
create policy "Add project members" on project_members for insert with check (
  (SELECT leader_id = auth.uid() FROM projects WHERE id = project_id)
  OR public.is_project_admin(project_id, auth.uid())
);

drop policy if exists "Remove project members" on project_members;
create policy "Remove project members" on project_members for delete using (
  auth.uid() = member_id 
  OR (SELECT leader_id = auth.uid() FROM projects WHERE id = project_id)
  OR public.is_project_admin(project_id, auth.uid())
);
