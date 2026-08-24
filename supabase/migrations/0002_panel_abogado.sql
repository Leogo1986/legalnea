-- ============================================================
-- Panel de abogado: dashboard, línea de tiempo del caso, chat,
-- marcar mensajes como leídos.
-- ============================================================

-- Nuevo estado real para casos anulados (hasta ahora no había forma de
-- distinguirlo de 'cerrada' genérico).
alter type estado_solicitud add value if not exists 'anulada';

-- ---------- solicitud_eventos ----------
-- Bitácora de etapas del trámite: historial cronológico que carga el
-- abogado asignado (o el admin). Es la línea de tiempo real del caso que ve
-- el cliente — no reemplaza `solicitudes.estado`, que sigue siendo el
-- estado de triage interno del equipo de Legal Nea.
create table solicitud_eventos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  autor_id uuid references auth.users(id),
  autor_rol rol not null,
  etapa text not null,
  nota text,
  created_at timestamptz not null default now()
);

create index idx_solicitud_eventos_solicitud on solicitud_eventos(solicitud_id);

alter table solicitud_eventos enable row level security;

-- Mismo patrón "involucrados" que ya usan solicitud_adjuntos y mensajes.
create policy "eventos_select_involucrados" on solicitud_eventos
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

create policy "eventos_insert_abogado_o_admin" on solicitud_eventos
  for insert to authenticated
  with check (
    autor_id = auth.uid() and (
      exists (
        select 1 from solicitudes s
        join abogados a on a.id = s.abogado_asignado_id
        where s.id = solicitud_id and a.user_id = auth.uid()
      )
      or auth_rol() = 'admin'
    )
  );

-- ---------- mensajes: marcar como leído ----------
-- Faltaba policy de UPDATE (la columna `leido` existía pero nadie podía
-- tocarla). Habilita el badge de "no leídos" en el nav del abogado/cliente.
create policy "mensajes_update_marcar_leido" on mensajes
  for update to authenticated
  using (
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
  with check (true);
