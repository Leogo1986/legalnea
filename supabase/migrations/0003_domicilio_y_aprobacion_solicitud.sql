-- ============================================================
-- Domicilio partido (calle/altura/piso/dpto) + aprobación explícita
-- de solicitudes de cliente (gate antes de crear la cuenta de Auth).
-- ============================================================

-- ---------- domicilio partido ----------
-- `direccion` se mantiene (varios lugares del código ya la leen como texto
-- compuesto para mostrar); calle/altura/piso/dpto son los campos reales que
-- carga el usuario y a partir de los cuales el server arma `direccion`.
alter table abogados
  add column if not exists calle text,
  add column if not exists altura text,
  add column if not exists piso text,
  add column if not exists dpto text;

alter table clientes
  add column if not exists calle text,
  add column if not exists altura text,
  add column if not exists piso text,
  add column if not exists dpto text;

-- ---------- aprobación de solicitudes ----------
-- Mismo patrón que ya existe en `abogados` (aprobado_por/fecha_aprobacion/
-- motivo_rechazo): hoy la cuenta de Auth del cliente se crea apenas manda el
-- formulario, sin aprobación real del admin. Se agrega 'rechazada' al enum y
-- las columnas de auditoría de la aprobación/rechazo.
alter type estado_solicitud add value if not exists 'rechazada';

alter table solicitudes
  add column if not exists aprobada_por uuid references auth.users(id),
  add column if not exists fecha_aprobacion timestamptz,
  add column if not exists motivo_rechazo text;
