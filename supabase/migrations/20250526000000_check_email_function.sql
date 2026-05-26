create or replace function public.check_email_exists(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from auth.users where email = p_email
  );
end;
$$;
