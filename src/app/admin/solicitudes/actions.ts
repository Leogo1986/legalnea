"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { vincularCuentaCliente } from "@/lib/auth/vincular-cuenta-cliente";
import { generarPasswordTemporal } from "@/lib/auth/generar-password";
import type { EstadoSolicitud, Prioridad } from "@/types/database";

type ResultadoAccion = { success: true } | { success: false; error: string };
type ResultadoConClave =
  | { success: true; password?: string }
  | { success: false; error: string };

// Aprueba una solicitud "nueva": recién acá se crea/vincula la cuenta de
// Auth del cliente (ver lib/auth/vincular-cuenta-cliente.ts) — es el gate
// real que pidió el usuario, no cualquiera que llena el formulario público
// termina con una cuenta activa. Si la cuenta se crea en este paso, devuelve
// la clave temporal generada (`password`) para que el admin la mande por
// WhatsApp — si el cliente ya tenía cuenta de una solicitud anterior, no
// viene clave (usar "Generar nueva clave" si hace falta).
export async function aprobarSolicitud(solicitudId: string): Promise<ResultadoConClave> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: solicitud, error: errorGet } = await admin
    .from("solicitudes")
    .select("id, estado, cliente_id, clientes(id, user_id, email, nombre_completo)")
    .eq("id", solicitudId)
    .single();

  if (errorGet || !solicitud) return { success: false, error: "Solicitud no encontrada." };

  const cliente = solicitud.clientes as unknown as {
    id: string;
    user_id: string | null;
    email: string;
    nombre_completo: string;
  } | null;

  if (!cliente) return { success: false, error: "No encontramos al cliente de esta solicitud." };

  let password: string | undefined;
  if (!cliente.user_id) {
    const res = await vincularCuentaCliente(admin, cliente.id, cliente.email, cliente.nombre_completo);
    password = res.password ?? undefined;
  }

  const nuevoEstado = solicitud.estado === "nueva" ? "en_revision" : solicitud.estado;

  const { error } = await admin
    .from("solicitudes")
    .update({
      estado: nuevoEstado,
      aprobada_por: user.id,
      fecha_aprobacion: new Date().toISOString(),
      motivo_rechazo: null,
    })
    .eq("id", solicitudId);

  if (error) return { success: false, error: "No pudimos aprobar la solicitud." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "aprobar_solicitud",
    entidad: "solicitudes",
    entidad_id: solicitudId,
  });

  revalidatePath("/admin/solicitudes");
  return { success: true, password };
}

export async function rechazarSolicitud(
  solicitudId: string,
  motivo: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("solicitudes")
    .update({ estado: "rechazada", motivo_rechazo: motivo || null })
    .eq("id", solicitudId);

  if (error) return { success: false, error: "No pudimos rechazar la solicitud." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "rechazar_solicitud",
    entidad: "solicitudes",
    entidad_id: solicitudId,
    detalle: { motivo },
  });

  revalidatePath("/admin/solicitudes");
  return { success: true };
}

export async function cambiarEstadoSolicitud(
  solicitudId: string,
  estado: EstadoSolicitud
): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("solicitudes")
    .update({ estado })
    .eq("id", solicitudId);

  if (error) return { success: false, error: "No pudimos cambiar el estado." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "cambiar_estado_solicitud",
    entidad: "solicitudes",
    entidad_id: solicitudId,
    detalle: { estado },
  });

  revalidatePath("/admin/solicitudes");
  return { success: true };
}

export async function cambiarPrioridadSolicitud(
  solicitudId: string,
  prioridad: Prioridad
): Promise<ResultadoAccion> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("solicitudes")
    .update({ prioridad })
    .eq("id", solicitudId);

  if (error) return { success: false, error: "No pudimos cambiar la prioridad." };

  revalidatePath("/admin/solicitudes");
  return { success: true };
}

export async function asignarAbogado(
  solicitudId: string,
  abogadoId: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: solicitud } = await admin
    .from("solicitudes")
    .select("estado")
    .eq("id", solicitudId)
    .single();

  const nuevoEstado =
    solicitud && (solicitud.estado === "nueva" || solicitud.estado === "en_revision")
      ? "asignada"
      : solicitud?.estado;

  const { error } = await admin
    .from("solicitudes")
    .update({
      abogado_asignado_id: abogadoId,
      fecha_asignacion: new Date().toISOString(),
      estado: nuevoEstado,
    })
    .eq("id", solicitudId);

  if (error) return { success: false, error: "No pudimos asignar el abogado." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "asignar_abogado",
    entidad: "solicitudes",
    entidad_id: solicitudId,
    detalle: { abogado_id: abogadoId },
  });

  revalidatePath("/admin/solicitudes");
  return { success: true };
}

// Genera y setea una clave nueva directo por Auth admin (sin mail/Resend de
// por medio) para un cliente que YA tiene cuenta — para mandarla por
// WhatsApp igual que al aprobar. Requiere que el cliente tenga perfil (si
// nunca fue aprobado, no hay cuenta que resetear).
export async function generarClaveClienteExistente(email: string): Promise<ResultadoConClave> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!perfil) {
    return { success: false, error: "Ese cliente todavía no tiene cuenta (aprobá su solicitud primero)." };
  }

  const password = generarPasswordTemporal();
  const { error } = await admin.auth.admin.updateUserById(perfil.id, { password });

  if (error) return { success: false, error: "No pudimos generar la clave." };
  return { success: true, password };
}

export async function enviarMensajeAdmin(
  solicitudId: string,
  contenido: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  if (!contenido.trim()) return { success: false, error: "Escribí un mensaje." };

  const admin = createAdminClient();
  const { error } = await admin.from("mensajes").insert({
    solicitud_id: solicitudId,
    autor_id: user.id,
    autor_rol: "admin",
    contenido: contenido.trim(),
  });

  if (error) return { success: false, error: "No pudimos enviar el mensaje." };

  revalidatePath("/admin/solicitudes");
  return { success: true };
}

export async function obtenerUrlFirmadaAdjunto(
  rutaStorage: string
): Promise<{ url: string | null }> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from("adjuntos-solicitudes")
    .createSignedUrl(rutaStorage, 60 * 5);

  if (error || !data) return { url: null };
  return { url: data.signedUrl };
}
