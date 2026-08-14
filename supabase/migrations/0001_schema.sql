-- Legal Nea Soft — Schema inicial
-- Enums, tablas, índices, triggers y RLS completas.

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type rol as enum ('admin', 'abogado', 'cliente');

create type estado_abogado as enum ('pendiente', 'aprobado', 'rechazado', 'inactivo');

create type categoria_especialidad as enum ('prioritaria_probono', 'general');

create type estado_solicitud as enum (
  'nueva', 'en_revision', 'asignada', 'en_curso', 'resuelta', 'derivada', 'cerrada'
);

create type prioridad as enum ('baja', 'media', 'alta', 'urgente');

-- ============================================================
-- FUNCIÓN helper: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Helper: rol del usuario autenticado actual (evita recursión RLS)
create or replace function auth_rol()
returns rol as $$
  select rol from perfiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- ============================================================
-- TABLA: perfiles (1:1 con auth.users)
-- ============================================================
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol rol not null,
  nombre_completo text not null,
  email text not null,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_perfiles_updated_at
  before update on perfiles
  for each row execute function set_updated_at();

-- ============================================================
-- TABLA: especialidades
-- ============================================================
create table especialidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  categoria categoria_especialidad not null default 'general',
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLA: abogados
-- ============================================================
create table abogados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nombre_completo text not null,
  dni text,
  email text not null unique,
  telefono text not null,
  provincia text not null,
  localidad text not null,
  direccion text,
  codigo_postal text,
  matricula_federal text,
  matricula_provincial text,
  anios_experiencia integer,
  motivacion text,
  estado estado_abogado not null default 'pendiente',
  acepto_declaracion_jurada boolean not null default false,
  fecha_aceptacion_dj timestamptz,
  declaracion_jurada_pdf_url text,
  motivo_rechazo text,
  aprobado_por uuid references auth.users(id),
  fecha_aprobacion timestamptz,
  fecha_alta timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Anti autoaprobación: toda fila creada por el público debe entrar pendiente y sin usuario asociado
  constraint chk_abogado_alta_publica check (
    (user_id is null and estado = 'pendiente') or (user_id is not null)
  )
);

create index idx_abogados_estado on abogados(estado);
create index idx_abogados_provincia on abogados(provincia);
create index idx_abogados_user_id on abogados(user_id);

create trigger trg_abogados_updated_at
  before update on abogados
  for each row execute function set_updated_at();

-- ============================================================
-- TABLA: abogado_especialidades (N:M)
-- ============================================================
create table abogado_especialidades (
  abogado_id uuid not null references abogados(id) on delete cascade,
  especialidad_id uuid not null references especialidades(id) on delete cascade,
  primary key (abogado_id, especialidad_id)
);

create index idx_abogado_esp_especialidad on abogado_especialidades(especialidad_id);

-- ============================================================
-- TABLA: clientes
-- ============================================================
create table clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nombre_completo text not null,
  dni text,
  email text not null,
  telefono text not null,
  provincia text not null,
  localidad text not null,
  direccion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clientes_user_id on clientes(user_id);

create trigger trg_clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();

-- ============================================================
-- TABLA: solicitudes
-- ============================================================
create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  especialidad_id uuid references especialidades(id),
  motivo_consulta text not null,
  descripcion text not null,
  declaracion_veracidad_aceptada boolean not null default false,
  estado estado_solicitud not null default 'nueva',
  prioridad prioridad not null default 'media',
  abogado_asignado_id uuid references abogados(id),
  fecha_asignacion timestamptz,
  resolucion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_solicitudes_estado on solicitudes(estado);
create index idx_solicitudes_cliente on solicitudes(cliente_id);
create index idx_solicitudes_abogado on solicitudes(abogado_asignado_id);
create index idx_solicitudes_especialidad on solicitudes(especialidad_id);

create trigger trg_solicitudes_updated_at
  before update on solicitudes
  for each row execute function set_updated_at();

-- ============================================================
-- TABLA: solicitud_adjuntos
-- ============================================================
create table solicitud_adjuntos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null,
  tipo_mime text not null,
  tamanio_bytes integer not null,
  created_at timestamptz not null default now()
);

create index idx_adjuntos_solicitud on solicitud_adjuntos(solicitud_id);

-- ============================================================
-- TABLA: mensajes
-- ============================================================
create table mensajes (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  autor_id uuid not null references auth.users(id),
  autor_rol rol not null,
  contenido text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_mensajes_solicitud on mensajes(solicitud_id);

-- ============================================================
-- TABLA: logs_auditoria
-- ============================================================
create table logs_auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id),
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index idx_logs_entidad on logs_auditoria(entidad, entidad_id);
create index idx_logs_usuario on logs_auditoria(usuario_id);

-- ============================================================
-- TABLA: plantillas_email
-- ============================================================
create table plantillas_email (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  asunto text not null,
  cuerpo_html text not null,
  activa boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger trg_plantillas_updated_at
  before update on plantillas_email
  for each row execute function set_updated_at();

-- ============================================================
-- TABLA: notificaciones_admin
-- ============================================================
create table notificaciones_admin (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  leida boolean not null default false,
  entidad_id uuid,
  created_at timestamptz not null default now()
);

create index idx_notif_leida on notificaciones_admin(leida);

-- ============================================================
-- RLS: activar en todas las tablas
-- ============================================================
alter table perfiles enable row level security;
alter table especialidades enable row level security;
alter table abogados enable row level security;
alter table abogado_especialidades enable row level security;
alter table clientes enable row level security;
alter table solicitudes enable row level security;
alter table solicitud_adjuntos enable row level security;
alter table mensajes enable row level security;
alter table logs_auditoria enable row level security;
alter table plantillas_email enable row level security;
alter table notificaciones_admin enable row level security;

-- ---------- perfiles ----------
create policy "perfiles_select_own_or_admin" on perfiles
  for select using (id = auth.uid() or auth_rol() = 'admin');

create policy "perfiles_update_own_or_admin" on perfiles
  for update using (id = auth.uid() or auth_rol() = 'admin');

create policy "perfiles_insert_admin_or_self" on perfiles
  for insert with check (id = auth.uid() or auth_rol() = 'admin');

-- ---------- especialidades ----------
create policy "especialidades_select_public" on especialidades
  for select using (activa = true or auth_rol() = 'admin');

create policy "especialidades_write_admin" on especialidades
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ---------- abogados ----------
-- Alta pública (formulario anónimo): solo pendiente y sin user_id (anti-autoaprobación)
create policy "abogados_insert_publico" on abogados
  for insert to anon
  with check (estado = 'pendiente' and user_id is null);

-- Listado en vivo: cualquiera ve abogados aprobados
create policy "abogados_select_publico_aprobados" on abogados
  for select using (estado = 'aprobado');

-- El propio abogado ve/edita su fila
create policy "abogados_select_own" on abogados
  for select using (user_id = auth.uid());

create policy "abogados_update_own" on abogados
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin: control total
create policy "abogados_admin_all" on abogados
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ---------- abogado_especialidades ----------
create policy "abogado_esp_select_publico" on abogado_especialidades
  for select using (
    exists (select 1 from abogados a where a.id = abogado_id and a.estado = 'aprobado')
    or exists (select 1 from abogados a where a.id = abogado_id and a.user_id = auth.uid())
    or auth_rol() = 'admin'
  );

create policy "abogado_esp_insert_publico" on abogado_especialidades
  for insert to anon
  with check (exists (select 1 from abogados a where a.id = abogado_id and a.estado = 'pendiente' and a.user_id is null));

create policy "abogado_esp_admin_all" on abogado_especialidades
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ---------- clientes ----------
create policy "clientes_insert_publico" on clientes
  for insert to anon
  with check (user_id is null);

create policy "clientes_select_own_or_admin" on clientes
  for select using (user_id = auth.uid() or auth_rol() = 'admin');

create policy "clientes_update_own_or_admin" on clientes
  for update using (user_id = auth.uid() or auth_rol() = 'admin');

create policy "clientes_admin_insert" on clientes
  for insert to authenticated
  with check (auth_rol() = 'admin');

-- ---------- solicitudes ----------
create policy "solicitudes_insert_publico" on solicitudes
  for insert to anon
  with check (true);

create policy "solicitudes_select_involucrados" on solicitudes
  for select using (
    exists (select 1 from clientes c where c.id = cliente_id and c.user_id = auth.uid())
    or exists (select 1 from abogados a where a.id = abogado_asignado_id and a.user_id = auth.uid())
    or auth_rol() = 'admin'
  );

create policy "solicitudes_update_involucrados" on solicitudes
  for update using (
    exists (select 1 from abogados a where a.id = abogado_asignado_id and a.user_id = auth.uid())
    or auth_rol() = 'admin'
  );

-- ---------- solicitud_adjuntos ----------
create policy "adjuntos_insert_publico" on solicitud_adjuntos
  for insert to anon
  with check (true);

-- Cliente logueado agregando adjuntos adicionales a su propia solicitud
-- desde /cliente/solicitud (el alta inicial anónima usa la policy de arriba).
create policy "adjuntos_insert_propio" on solicitud_adjuntos
  for insert to authenticated
  with check (
    exists (
      select 1 from solicitudes s
      join clientes c on c.id = s.cliente_id
      where s.id = solicitud_id and c.user_id = auth.uid()
    )
  );

create policy "adjuntos_select_involucrados" on solicitud_adjuntos
  for select using (
    exists (
      select 1 from solicitudes s
      join clientes c on c.id = s.cliente_id
      where s.id = solicitud_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from solicitudes s
      join abogados a on a.id = s.abogado_asignado_id
      where s.id = solicitud_id and a.user_id = auth.uid()
    )
    or auth_rol() = 'admin'
  );

-- ---------- mensajes ----------
create policy "mensajes_select_involucrados" on mensajes
  for select using (
    exists (
      select 1 from solicitudes s
      join clientes c on c.id = s.cliente_id
      where s.id = solicitud_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from solicitudes s
      join abogados a on a.id = s.abogado_asignado_id
      where s.id = solicitud_id and a.user_id = auth.uid()
    )
    or auth_rol() = 'admin'
  );

create policy "mensajes_insert_involucrados" on mensajes
  for insert to authenticated
  with check (
    autor_id = auth.uid() and (
      exists (
        select 1 from solicitudes s
        join clientes c on c.id = s.cliente_id
        where s.id = solicitud_id and c.user_id = auth.uid()
      )
      or exists (
        select 1 from solicitudes s
        join abogados a on a.id = s.abogado_asignado_id
        where s.id = solicitud_id and a.user_id = auth.uid()
      )
      or auth_rol() = 'admin'
    )
  );

-- ---------- logs_auditoria (solo admin) ----------
create policy "logs_admin_all" on logs_auditoria
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ---------- plantillas_email (solo admin) ----------
create policy "plantillas_admin_all" on plantillas_email
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ---------- notificaciones_admin (solo admin) ----------
create policy "notificaciones_admin_all" on notificaciones_admin
  for all using (auth_rol() = 'admin') with check (auth_rol() = 'admin');

-- ============================================================
-- STORAGE: bucket privado de adjuntos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('adjuntos-solicitudes', 'adjuntos-solicitudes', false)
on conflict (id) do nothing;

create policy "storage_adjuntos_insert_publico" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'adjuntos-solicitudes');

create policy "storage_adjuntos_select_admin" on storage.objects
  for select using (bucket_id = 'adjuntos-solicitudes' and auth_rol() = 'admin');

create policy "storage_adjuntos_select_involucrados" on storage.objects
  for select using (
    bucket_id = 'adjuntos-solicitudes' and (
      exists (
        select 1 from solicitud_adjuntos sa
        join solicitudes s on s.id = sa.solicitud_id
        join clientes c on c.id = s.cliente_id
        where sa.ruta_storage = storage.objects.name and c.user_id = auth.uid()
      )
      or exists (
        select 1 from solicitud_adjuntos sa
        join solicitudes s on s.id = sa.solicitud_id
        join abogados a on a.id = s.abogado_asignado_id
        where sa.ruta_storage = storage.objects.name and a.user_id = auth.uid()
      )
    )
  );

-- Bucket público para PDFs de declaración jurada (descargables por el propio abogado que lo generó)
insert into storage.buckets (id, name, public)
values ('declaraciones-juradas', 'declaraciones-juradas', false)
on conflict (id) do nothing;

create policy "storage_dj_insert_publico" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'declaraciones-juradas');

create policy "storage_dj_select_admin" on storage.objects
  for select using (bucket_id = 'declaraciones-juradas' and auth_rol() = 'admin');
