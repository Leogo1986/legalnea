"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { generarYEnviarReseteoPassword } from "@/lib/auth/enviar-reseteo";
import type { EstadoSolicitud, Prioridad } from "@/types/database";

type ResultadoAccion = { success: true } | { success: false; error: string };

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

export async function resetearPasswordCliente(email: string): Promise<ResultadoAccion> {
  await requireRole("admin");
  const res = await generarYEnviarReseteoPassword(email);
  if (!res.ok) return { success: false, error: "No pudimos generar el link de reseteo." };
  return { success: true };
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
