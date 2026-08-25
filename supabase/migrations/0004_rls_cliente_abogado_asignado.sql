-- ============================================================
-- El abogado asignado a una solicitud no podía leer los datos del cliente
-- (RLS de `clientes` solo dejaba pasar al dueño de la cuenta o al admin) —
-- por eso en el detalle de caso del abogado el email/teléfono/domicilio del
-- cliente aparecían vacíos ("—"): el embed `clientes(...)` de la query
-- quedaba filtrado a null por la policy existente, no por falta de datos.
-- ============================================================

create policy "clientes_select_abogado_asignado" on clientes
  for select using (
    exists (
      select 1 from solicitudes s
      join abogados a on a.id = s.abogado_asignado_id
      where s.cliente_id = clientes.id and a.user_id = auth.uid()
    )
  );
