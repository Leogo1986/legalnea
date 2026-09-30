-- ============================================================
-- 0007 — Hardening de seguridad (auditoría Cyber Neo 2026-09-30)
--
-- Contexto: la anon key de Supabase es pública (viaja en el navegador), así
-- que cualquiera puede hablar directo con PostgREST/Storage sin pasar por la
-- app. RLS + GRANTs son la única barrera real. Esta migración cierra:
--   CN-001 escalada a admin vía perfiles.rol (update/insert propio)
--   CN-004 SELECT público de TODAS las columnas de abogados aprobados
--   CN-005 abogado edita cualquier columna propia (estado, email, DJ…)
--   CN-006 inserts anónimos directos (clientes, solicitudes, abogados, adjuntos)
--   CN-007 mensajes: UPDATE con WITH CHECK (true)
--   CN-009 Storage: subida anónima y buckets sin límites
--   CN-011 abogado suspendido conserva acceso
--   CN-013 cliente lee/escribe el chat interno; autor_rol falsificable
--   CN-014 ruta_storage de adjuntos no atada a la solicitud
--   CN-015 abogado asignado edita cualquier columna de la solicitud
--   CN-023 sin límites de longitud en la base
--   CN-025 logs de auditoría modificables; cambios directos sin auditar
--   CN-033 search_path de funciones / EXECUTE por defecto
--
-- Regla de diseño: TODAS las políticas nuevas llevan `to anon`/`to
-- authenticated` explícito. Las subconsultas dentro de una política se
-- evalúan con los permisos de quien consulta, así que una política sin `TO`
-- que mire `abogados.user_id` rompería el listado público ahora que anon ya
-- no puede leer esa columna.
--
-- Las escrituras de admin y de las altas públicas van por service role
-- (bypassea RLS y GRANTs), así que no dependen de nada de esto.
--
-- Todo corre en una transacción: si algo falla, no se aplica nada.
-- ============================================================

begin;

-- ============================================================
-- 1. FUNCIONES
-- ============================================================

-- Rol del usuario actual. Ahora ignora perfiles desactivados.
create or replace function public.auth_rol()
returns public.rol
language sql stable security definer set search_path = ''
as $$
  select p.rol from public.perfiles p where p.id = auth.uid() and p.activo
$$;

-- id del abogado del usuario actual, SOLO si está aprobado (un suspendido
-- deja de ver casos al instante).
create or replace function public.mi_abogado_id_activo()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select a.id from public.abogados a
  where a.user_id = auth.uid() and a.estado = 'aprobado'
  limit 1
$$;

create or replace function public.cliente_tiene_abogado_asignado(p_cliente_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.solicitudes s
    join public.abogados a on a.id = s.abogado_asignado_id
    where s.cliente_id = p_cliente_id
      and a.user_id = auth.uid()
      and a.estado = 'aprobado'
  )
$$;

alter function public.set_updated_at() set search_path = '';

-- ============================================================
-- 2. PERFILES (CN-001)
-- ============================================================
drop policy if exists "perfiles_update_own_or_admin" on public.perfiles;
drop policy if exists "perfiles_insert_admin_or_self" on public.perfiles;
drop policy if exists "perfiles_select_own_or_admin" on public.perfiles;

revoke all on public.perfiles from anon;
revoke insert, update, delete, truncate, references, trigger on public.perfiles from authenticated;
-- Lo único que la app edita con la sesión del usuario:
-- admin/perfil/actions.ts (nombre, teléfono) y avatar-upload.tsx (avatar_url).
grant update (nombre_completo, telefono, avatar_url) on public.perfiles to authenticated;

create policy "perfiles_select_own_or_admin" on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.auth_rol()) = 'admin');

create policy "perfiles_update_own" on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- Sin política de INSERT: los perfiles los crea solo el service role.

-- Defensa en profundidad: aunque algún día se vuelva a dar UPDATE de más,
-- rol/email/activo/id solo cambian desde service_role/postgres.
create or replace function public.perfiles_bloquear_columnas_protegidas()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and (
       new.id     is distinct from old.id
    or new.rol    is distinct from old.rol
    or new.email  is distinct from old.email
    or new.activo is distinct from old.activo) then
    raise exception 'perfiles: columna protegida' using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists trg_perfiles_columnas_protegidas on public.perfiles;
create trigger trg_perfiles_columnas_protegidas
  before update on public.perfiles
  for each row execute function public.perfiles_bloquear_columnas_protegidas();

-- avatar_url solo puede apuntar al objeto propio del bucket avatars.
alter table public.perfiles drop constraint if exists chk_avatar_url;
alter table public.perfiles add constraint chk_avatar_url check (
  avatar_url is null
  or avatar_url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/avatars/[0-9a-f-]{36}(\?t=[0-9]+)?$'
) not valid;

-- ============================================================
-- 3. ABOGADOS (CN-004, CN-005, CN-006)
-- ============================================================
drop policy if exists "abogados_insert_publico" on public.abogados;
drop policy if exists "abogados_select_publico_aprobados" on public.abogados;
drop policy if exists "abogados_select_own" on public.abogados;
drop policy if exists "abogados_update_own" on public.abogados;
drop policy if exists "abogados_admin_all" on public.abogados;

-- Columnas: el listado público y los paneles solo necesitan esto. Los datos
-- personales (email, teléfono, DNI, domicilio, matrículas, DJ…) quedan solo
-- para service role: admin/abogados/page.tsx y abogado/perfil/page.tsx los
-- leen con el cliente admin después de requireRole().
revoke all on public.abogados from anon, authenticated;
grant select (id, nombre_completo, provincia, localidad, fecha_alta, estado)
  on public.abogados to anon;
grant select (id, user_id, nombre_completo, provincia, localidad, fecha_alta, estado)
  on public.abogados to authenticated;
-- Mismas columnas que edita abogado/perfil/actions.ts.
grant update (nombre_completo, telefono, calle, altura, piso, dpto, direccion,
              provincia, localidad, codigo_postal, matricula_federal, matricula_provincial)
  on public.abogados to authenticated;

create policy "abogados_select_aprobados" on public.abogados
  for select to anon, authenticated
  using (estado = 'aprobado');

create policy "abogados_select_own" on public.abogados
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "abogados_select_admin" on public.abogados
  for select to authenticated
  using ((select public.auth_rol()) = 'admin');

-- Solo un abogado aprobado edita su ficha (uno suspendido no se reactiva solo).
create policy "abogados_update_own" on public.abogados
  for update to authenticated
  using (user_id = (select auth.uid()) and estado = 'aprobado')
  with check (user_id = (select auth.uid()) and estado = 'aprobado');

-- ============================================================
-- 4. ABOGADO_ESPECIALIDADES
-- ============================================================
drop policy if exists "abogado_esp_select_publico" on public.abogado_especialidades;
drop policy if exists "abogado_esp_insert_publico" on public.abogado_especialidades;
drop policy if exists "abogado_esp_admin_all" on public.abogado_especialidades;

revoke insert, update, delete, truncate on public.abogado_especialidades from anon, authenticated;

create policy "abogado_esp_select_aprobados" on public.abogado_especialidades
  for select to anon, authenticated
  using (exists (select 1 from public.abogados a
                 where a.id = abogado_id and a.estado = 'aprobado'));

create policy "abogado_esp_select_propio_o_admin" on public.abogado_especialidades
  for select to authenticated
  using (exists (select 1 from public.abogados a
                 where a.id = abogado_id and a.user_id = (select auth.uid()))
         or (select public.auth_rol()) = 'admin');

-- ============================================================
-- 5. CLIENTES (CN-006)
-- ============================================================
drop policy if exists "clientes_insert_publico" on public.clientes;
drop policy if exists "clientes_admin_insert" on public.clientes;
drop policy if exists "clientes_select_own_or_admin" on public.clientes;
drop policy if exists "clientes_update_own_or_admin" on public.clientes;
drop policy if exists "clientes_select_abogado_asignado" on public.clientes;

revoke all on public.clientes from anon;
revoke insert, update, delete, truncate on public.clientes from authenticated;
-- Mismas columnas que edita cliente/perfil/actions.ts (sin email: es el login).
grant update (nombre_completo, telefono, calle, altura, piso, dpto, direccion, provincia, localidad)
  on public.clientes to authenticated;

create policy "clientes_select_own_or_admin" on public.clientes
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.auth_rol()) = 'admin');

create policy "clientes_select_abogado_asignado" on public.clientes
  for select to authenticated
  using (public.cliente_tiene_abogado_asignado(id));

create policy "clientes_update_own" on public.clientes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================================================
-- 6. SOLICITUDES (CN-006, CN-011, CN-015)
-- ============================================================
drop policy if exists "solicitudes_insert_publico" on public.solicitudes;
drop policy if exists "solicitudes_select_involucrados" on public.solicitudes;
drop policy if exists "solicitudes_update_involucrados" on public.solicitudes;

-- Nadie escribe solicitudes con la sesión: altas y cambios van por service role.
revoke all on public.solicitudes from anon;
revoke insert, update, delete, truncate on public.solicitudes from authenticated;

create policy "solicitudes_select_involucrados" on public.solicitudes
  for select to authenticated
  using (
    exists (select 1 from public.clientes c
            where c.id = cliente_id and c.user_id = (select auth.uid()))
    or abogado_asignado_id = (select public.mi_abogado_id_activo())
    or (select public.auth_rol()) = 'admin'
  );

-- ============================================================
-- 7. SOLICITUD_ADJUNTOS (CN-006, CN-014)
-- ============================================================
drop policy if exists "adjuntos_insert_publico" on public.solicitud_adjuntos;
drop policy if exists "adjuntos_insert_propio" on public.solicitud_adjuntos;
drop policy if exists "adjuntos_select_involucrados" on public.solicitud_adjuntos;

revoke all on public.solicitud_adjuntos from anon;
revoke update, delete, truncate on public.solicitud_adjuntos from authenticated;

-- La ruta tiene que estar dentro de la carpeta de ESA solicitud, y la
-- solicitud tiene que ser del cliente logueado.
create policy "adjuntos_insert_propio" on public.solicitud_adjuntos
  for insert to authenticated
  with check (
    split_part(ruta_storage, '/', 1) = solicitud_id::text
    and exists (select 1 from public.solicitudes s
                join public.clientes c on c.id = s.cliente_id
                where s.id = solicitud_id and c.user_id = (select auth.uid()))
  );

create policy "adjuntos_select_involucrados" on public.solicitud_adjuntos
  for select to authenticated
  using (
    exists (select 1 from public.solicitudes s
            join public.clientes c on c.id = s.cliente_id
            where s.id = solicitud_id and c.user_id = (select auth.uid()))
    or exists (select 1 from public.solicitudes s
               where s.id = solicitud_id
                 and s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
    or (select public.auth_rol()) = 'admin'
  );

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'uq_adjuntos_ruta') then
    if exists (select ruta_storage from public.solicitud_adjuntos
               group by ruta_storage having count(*) > 1) then
      raise warning 'solicitud_adjuntos tiene ruta_storage duplicadas: revisar (posible explotación de CN-014). No se crea uq_adjuntos_ruta.';
    else
      alter table public.solicitud_adjuntos add constraint uq_adjuntos_ruta unique (ruta_storage);
    end if;
  end if;
end
$$;

-- ============================================================
-- 8. MENSAJES — chat interno abogado ↔ admin (CN-007, CN-013)
-- El cliente no tiene chat (commit 1907cd7): se le quita acceso también en la base.
-- El admin escribe con service role.
-- ============================================================
drop policy if exists "mensajes_select_involucrados" on public.mensajes;
drop policy if exists "mensajes_insert_involucrados" on public.mensajes;
drop policy if exists "mensajes_update_marcar_leido" on public.mensajes;

revoke all on public.mensajes from anon;
revoke insert, update, delete, truncate on public.mensajes from authenticated;
grant insert (solicitud_id, autor_id, autor_rol, contenido) on public.mensajes to authenticated;
grant update (leido) on public.mensajes to authenticated;

create policy "mensajes_select_abogado_o_admin" on public.mensajes
  for select to authenticated
  using (
    exists (select 1 from public.solicitudes s
            where s.id = solicitud_id
              and s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
    or (select public.auth_rol()) = 'admin'
  );

create policy "mensajes_insert_abogado" on public.mensajes
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and autor_rol = 'abogado'
    and exists (select 1 from public.solicitudes s
                where s.id = solicitud_id
                  and s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
  );

create policy "mensajes_update_marcar_leido" on public.mensajes
  for update to authenticated
  using (
    exists (select 1 from public.solicitudes s
            where s.id = solicitud_id
              and s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
    or (select public.auth_rol()) = 'admin'
  )
  with check (
    exists (select 1 from public.solicitudes s
            where s.id = solicitud_id
              and s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
    or (select public.auth_rol()) = 'admin'
  );

-- ============================================================
-- 9. SOLICITUD_EVENTOS — línea de tiempo (CN-011, CN-013)
-- ============================================================
drop policy if exists "eventos_select_involucrados" on public.solicitud_eventos;
drop policy if exists "eventos_insert_abogado_o_admin" on public.solicitud_eventos;

revoke all on public.solicitud_eventos from anon;
revoke update, delete, truncate on public.solicitud_eventos from authenticated;

create policy "eventos_select_involucrados" on public.solicitud_eventos
  for select to authenticated
  using (
    exists (select 1 from public.solicitudes s
            join public.clientes c on c.id = s.cliente_id
            where s.id = solicitud_id and c.user_id = (select auth.uid()))
    or exists (select 1 from public.solicitudes s
               where s.id = solicitud_id
                 and s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
    or (select public.auth_rol()) = 'admin'
  );

-- autor_rol tiene que coincidir con el rol real de quien escribe.
create policy "eventos_insert_abogado_o_admin" on public.solicitud_eventos
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and (
      (autor_rol = 'abogado'
       and exists (select 1 from public.solicitudes s
                   where s.id = solicitud_id
                     and s.abogado_asignado_id = (select public.mi_abogado_id_activo())))
      or (autor_rol = 'admin' and (select public.auth_rol()) = 'admin')
    )
  );

-- ============================================================
-- 10. LOGS, NOTIFICACIONES, PLANTILLAS, ESPECIALIDADES (CN-025)
-- Todas las escrituras de admin van por service role.
-- ============================================================
drop policy if exists "logs_admin_all" on public.logs_auditoria;
revoke all on public.logs_auditoria from anon;
revoke insert, update, delete, truncate on public.logs_auditoria from authenticated;
create policy "logs_admin_select" on public.logs_auditoria
  for select to authenticated
  using ((select public.auth_rol()) = 'admin');

drop policy if exists "notificaciones_admin_all" on public.notificaciones_admin;
revoke all on public.notificaciones_admin from anon;
revoke insert, update, delete, truncate on public.notificaciones_admin from authenticated;
create policy "notificaciones_admin_select" on public.notificaciones_admin
  for select to authenticated
  using ((select public.auth_rol()) = 'admin');

drop policy if exists "plantillas_admin_all" on public.plantillas_email;
revoke all on public.plantillas_email from anon;
revoke insert, update, delete, truncate on public.plantillas_email from authenticated;
create policy "plantillas_admin_select" on public.plantillas_email
  for select to authenticated
  using ((select public.auth_rol()) = 'admin');

drop policy if exists "especialidades_write_admin" on public.especialidades;
revoke insert, update, delete, truncate on public.especialidades from anon, authenticated;

-- ============================================================
-- 11. STORAGE (CN-009, CN-014)
-- ============================================================
drop policy if exists "storage_adjuntos_insert_publico" on storage.objects;
drop policy if exists "storage_dj_insert_publico" on storage.objects;
drop policy if exists "storage_adjuntos_select_involucrados" on storage.objects;
drop policy if exists "storage_adjuntos_insert_propio" on storage.objects;

-- Alta pública (adjuntos y DJ) sube con service role. Con sesión, solo el
-- cliente dueño agrega adjuntos, y solo dentro de la carpeta de su solicitud.
create policy "storage_adjuntos_insert_propio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'adjuntos-solicitudes'
    and exists (select 1 from public.solicitudes s
                join public.clientes c on c.id = s.cliente_id
                where s.id::text = (storage.foldername(name))[1]
                  and c.user_id = (select auth.uid()))
  );

-- Lectura: el archivo tiene que estar registrado en solicitud_adjuntos Y
-- vivir en la carpeta de esa solicitud.
create policy "storage_adjuntos_select_involucrados" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'adjuntos-solicitudes'
    and exists (
      select 1 from public.solicitud_adjuntos sa
      join public.solicitudes s on s.id = sa.solicitud_id
      left join public.clientes c on c.id = s.cliente_id
      where sa.ruta_storage = storage.objects.name
        and s.id::text = (storage.foldername(storage.objects.name))[1]
        and (c.user_id = (select auth.uid())
             or s.abogado_asignado_id = (select public.mi_abogado_id_activo()))
    )
  );

update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png']
  where id = 'adjuntos-solicitudes';

update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['application/pdf']
  where id = 'declaraciones-juradas';

update storage.buckets
  set file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'avatars';

-- ============================================================
-- 12. PERMISOS DE EJECUCIÓN DE FUNCIONES
-- auth_rol() queda ejecutable por anon: la usan políticas que aplican a anon
-- (especialidades). Las otras dos solo aparecen en políticas `to authenticated`.
-- ============================================================
revoke execute on function public.cliente_tiene_abogado_asignado(uuid) from public, anon;
grant  execute on function public.cliente_tiene_abogado_asignado(uuid) to authenticated;
revoke execute on function public.mi_abogado_id_activo() from public, anon;
grant  execute on function public.mi_abogado_id_activo() to authenticated;

-- ============================================================
-- 13. AUDITORÍA AUTOMÁTICA EN LA BASE (CN-025)
-- Registra cambios aunque no pasen por la app (p. ej. directo por la API).
-- TG_ARGV = columnas a guardar (vacío = fila completa).
-- ============================================================
create or replace function public.auditar_cambio()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  if tg_nargs > 0 then
    v_old := (select jsonb_object_agg(k, v_old -> k) from unnest(tg_argv) k where v_old is not null);
    v_new := (select jsonb_object_agg(k, v_new -> k) from unnest(tg_argv) k where v_new is not null);
  end if;

  insert into public.logs_auditoria (usuario_id, accion, entidad, entidad_id, detalle)
  values (
    auth.uid(),
    'db_' || lower(tg_op),
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id')::uuid,
    jsonb_build_object('db_role', current_user, 'old', v_old, 'new', v_new)
  );
  return coalesce(new, old);
end
$$;

drop trigger if exists trg_audit_perfiles on public.perfiles;
create trigger trg_audit_perfiles
  after insert or update or delete on public.perfiles
  for each row execute function public.auditar_cambio('id', 'rol', 'email', 'activo', 'nombre_completo');

drop trigger if exists trg_audit_abogados on public.abogados;
create trigger trg_audit_abogados
  after update of estado, email, user_id, declaracion_jurada_pdf_url or delete on public.abogados
  for each row execute function public.auditar_cambio('id', 'estado', 'email', 'user_id', 'declaracion_jurada_pdf_url');

drop trigger if exists trg_audit_solicitudes on public.solicitudes;
create trigger trg_audit_solicitudes
  after update of estado, abogado_asignado_id, cliente_id or delete on public.solicitudes
  for each row execute function public.auditar_cambio('id', 'estado', 'abogado_asignado_id', 'cliente_id');

-- ============================================================
-- 14. LÍMITES DE LONGITUD (CN-023)
-- NOT VALID: no revisa filas viejas, sí todas las nuevas. Los topes son más
-- holgados que los de zod, para que la app nunca choque con ellos.
-- ============================================================
alter table public.perfiles
  drop constraint if exists chk_pf_largos,
  add constraint chk_pf_largos check (
    char_length(nombre_completo) <= 200
    and char_length(email) <= 254
    and (telefono is null or char_length(telefono) <= 40)
    and (avatar_url is null or char_length(avatar_url) <= 300)
  ) not valid;

alter table public.abogados
  drop constraint if exists chk_ab_largos,
  add constraint chk_ab_largos check (
    char_length(nombre_completo) <= 200
    and char_length(email) <= 254
    and char_length(telefono) <= 40
    and char_length(provincia) <= 120
    and char_length(localidad) <= 120
    and (dni is null or char_length(dni) <= 20)
    and (calle is null or char_length(calle) <= 200)
    and (altura is null or char_length(altura) <= 20)
    and (piso is null or char_length(piso) <= 20)
    and (dpto is null or char_length(dpto) <= 20)
    and (direccion is null or char_length(direccion) <= 400)
    and (codigo_postal is null or char_length(codigo_postal) <= 20)
    and (matricula_federal is null or char_length(matricula_federal) <= 100)
    and (matricula_provincial is null or char_length(matricula_provincial) <= 100)
    and (motivacion is null or char_length(motivacion) <= 5000)
    and (motivo_rechazo is null or char_length(motivo_rechazo) <= 2000)
    and (declaracion_jurada_pdf_url is null or char_length(declaracion_jurada_pdf_url) <= 300)
    and (anios_experiencia is null or anios_experiencia between 0 and 80)
  ) not valid;

alter table public.clientes
  drop constraint if exists chk_cl_largos,
  add constraint chk_cl_largos check (
    char_length(nombre_completo) <= 200
    and char_length(email) <= 254
    and char_length(telefono) <= 40
    and char_length(provincia) <= 120
    and char_length(localidad) <= 120
    and (dni is null or char_length(dni) <= 20)
    and (calle is null or char_length(calle) <= 200)
    and (altura is null or char_length(altura) <= 20)
    and (piso is null or char_length(piso) <= 20)
    and (dpto is null or char_length(dpto) <= 20)
    and (direccion is null or char_length(direccion) <= 400)
  ) not valid;

alter table public.solicitudes
  drop constraint if exists chk_sol_largos,
  add constraint chk_sol_largos check (
    char_length(motivo_consulta) <= 5000
    and char_length(descripcion) <= 5000
    and (resolucion is null or char_length(resolucion) <= 5000)
    and (motivo_rechazo is null or char_length(motivo_rechazo) <= 2000)
  ) not valid;

alter table public.solicitud_adjuntos
  drop constraint if exists chk_adj_largos,
  add constraint chk_adj_largos check (
    char_length(nombre_archivo) <= 255
    and char_length(ruta_storage) <= 500
    and char_length(tipo_mime) <= 100
    and tamanio_bytes between 0 and 10485760
  ) not valid;

alter table public.mensajes
  drop constraint if exists chk_msg_largo,
  add constraint chk_msg_largo check (char_length(contenido) between 1 and 5000) not valid;

alter table public.solicitud_eventos
  drop constraint if exists chk_ev_largos,
  add constraint chk_ev_largos check (
    char_length(etapa) between 1 and 200
    and (nota is null or char_length(nota) <= 2000)
  ) not valid;

-- ============================================================
-- 15. EMAIL ÚNICO EN PERFILES (CN-010)
-- Si hay duplicados NO se crea el índice y se avisa: un email duplicado es
-- indicio de que alguien se cambió el email para secuestrar una cuenta.
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'uq_perfiles_email') then
    if exists (select lower(email) from public.perfiles group by lower(email) having count(*) > 1) then
      raise warning 'perfiles tiene emails duplicados: revisar antes de limpiar (posible explotación de CN-001/CN-010). No se crea uq_perfiles_email.';
    else
      create unique index uq_perfiles_email on public.perfiles (lower(email));
    end if;
  end if;
end
$$;

commit;
