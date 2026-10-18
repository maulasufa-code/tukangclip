-- Daftar sebagai clipper. Halaman daftar mengirim role di user metadata.
-- Metadata bisa diisi siapa saja, jadi hanya 'creator' dan 'editor' (clipper) yang diterima.
-- 'admin' tidak pernah bisa dipilih dari sini.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'editor' then 'editor'::user_role else 'creator'::user_role end,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  insert into public.profile_private (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;
