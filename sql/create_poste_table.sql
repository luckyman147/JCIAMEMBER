
-- 1. Create the postes table
create table if not exists postes (
  id uuid default gen_random_uuid() primary key,
  role_id uuid references roles(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(role_id, name)
);

-- 2. Add poste_id to profiles table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'poste_id') then
    alter table profiles add column poste_id uuid references postes(id) on delete set null;
  end if;
end $$;

-- 3. Enable RLS on postes
alter table postes enable row level security;

-- 4. Policies for postes
create policy "Postes are viewable by everyone" on postes for select using (true);
create policy "Postes are manageable by admins" on postes for all using (
  exists (
    select 1 from profiles 
    join roles on profiles.role_id = roles.id 
    where profiles.id = auth.uid() 
    and roles.name in ('admin', 'president', 'vp')
  )
);

-- 5. Helper to seed initial data for the example given
do $$
declare
  v_role_id uuid;
begin
  select id into v_role_id from roles where name = 'conseiller' limit 1;
  
  if v_role_id is not null then
    insert into postes (role_id, name) 
    values (v_role_id, 'conseiller media')
    on conflict (role_id, name) do nothing;
  end if;
end $$;
