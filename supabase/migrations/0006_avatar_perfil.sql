-- Foto de perfil (avatar) para las 3 áreas — vive en `perfiles` (común a
-- admin/abogado/cliente) en vez de en `abogados`/`clientes`, para no
-- duplicar la columna. Bucket público: es una foto de perfil, no dato
-- sensible, y evita generar signed URLs cada vez que se pinta el avatar en
-- cualquier pantalla (topbar/sidebar).
alter table perfiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Convención: el nombre del objeto es literalmente auth.uid() (sin carpeta
-- ni extensión) — cada usuario tiene un único archivo, `upsert: true` en la
-- subida lo pisa, no quedan archivos huérfanos al cambiar de foto. Lectura
-- no necesita policy: el bucket es público, Storage sirve los objetos
-- directo por su URL pública sin pasar por RLS.
create policy "storage_avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "storage_avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "storage_avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text);
