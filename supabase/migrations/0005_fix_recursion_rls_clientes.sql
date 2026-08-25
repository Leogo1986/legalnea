-- ============================================================
-- Fix de la migración 0004: la policy `clientes_select_abogado_asignado`
-- causaba "infinite recursion detected in policy for relation clientes"
-- (Postgres 42P17) para TODOS los clientes, no solo los que tienen abogado
-- asignado — Postgres evalúa la policy al planificar cualquier SELECT sobre
-- `clientes`, sin importar si esa fila puntual la necesita.
--
-- Causa: esa policy consulta `solicitudes` dentro de su EXISTS, y la policy
-- de `solicitudes` (`solicitudes_select_involucrados`, ver 0001_schema.sql)
-- vuelve a consultar `clientes` para resolver "¿sos el dueño de este
-- cliente?" — bucle clientes → solicitudes → clientes.
--
-- Se resuelve igual que ya resuelve `auth_rol()` el mismo problema con
-- `perfiles`: una función security definer, que corre con los privilegios
-- de su dueño (bypassea RLS en sus propias consultas) en vez de con los del
-- usuario autenticado — así no vuelve a disparar la policy de `solicitudes`.
-- ============================================================

drop policy if exists "clientes_select_abogado_asignado" on clientes;

create or replace function cliente_tiene_abogado_asignado(p_cliente_id uuid)
returns boolean as $$
  select exists (
    select 1 from solicitudes s
    join abogados a on a.id = s.abogado_asignado_id
    where s.cliente_id = p_cliente_id and a.user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

create policy "clientes_select_abogado_asignado" on clientes
  for select using (cliente_tiene_abogado_asignado(id));
