"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type ResultadoAccion = { success: true } | { success: false; error: string };

// Mismo patrón que `verificarPropiaSolicitud` en cliente/solicitudes/actions.ts,
// pero verificando que el caso esté asignado a este abogado.
async function verificarSolicitudAsignada(solicitudId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes")
    .select("id, abogados!inner(user_id)")
    .eq("id", solicitudId)
    .eq("abogados.user_id", userId)
    .maybeSingle();
  return !!data;
}

// Cliente con la sesión del propio abogado (no admin): la RLS de
// storage.objects ya garantiza que solo pueda firmar adjuntos de
// solicitudes donde es el abogado asignado.
export async function obtenerUrlFirmadaPropia(
  rutaStorage: string
): Promise<{ url: string | null }> {
  await requireRole("abogado");
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("adjuntos-solicitudes")
    .createSignedUrl(rutaStorage, 60 * 5);

  if (error || !data) return { url: null };
  return { url: data.signedUrl };
}

export async function enviarMensajeAbogado(
  solicitudId: string,
  contenido: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("abogado");

  if (!contenido.trim()) return { success: false, error: "Escribí un mensaje." };
  if (!(await verificarSolicitudAsignada(solicitudId, user.id))) {
    return { success: false, error: "Ese caso no está asignado a vos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mensajes").insert({
    solicitud_id: solicitudId,
    autor_id: user.id,
    autor_rol: "abogado",
    contenido: contenido.trim(),
  });

  if (error) return { success: false, error: "No pudimos enviar el mensaje." };

  revalidatePath("/abogado/solicitudes");
  return { success: true };
}

export async function marcarMensajesLeidos(solicitudId: string): Promise<ResultadoAccion> {
  const { user } = await requireRole("abogado");
  if (!(await verificarSolicitudAsignada(solicitudId, user.id))) {
    return { success: false, error: "Ese caso no está asignado a vos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mensajes")
    .update({ leido: true })
    .eq("solicitud_id", solicitudId)
    .neq("autor_rol", "abogado")
    .eq("leido", false);

  // No bloqueante: si falla, el badge de no leídos simplemente no baja.
  if (error) return { success: false, error: "No pudimos marcar los mensajes como leídos." };
  return { success: true };
}

export async function agregarEventoCaso(
  solicitudId: string,
  etapa: string,
  nota: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("abogado");

  if (!etapa.trim()) return { success: false, error: "Elegí o escribí una etapa." };
  if (!(await verificarSolicitudAsignada(solicitudId, user.id))) {
    return { success: false, error: "Ese caso no está asignado a vos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("solicitud_eventos").insert({
    solicitud_id: solicitudId,
    autor_id: user.id,
    autor_rol: "abogado",
    etapa: etapa.trim(),
    nota: nota.trim() || null,
  });

  if (error) return { success: false, error: "No pudimos guardar la etapa." };

  revalidatePath("/abogado/solicitudes");
  revalidatePath(`/cliente/solicitudes/${solicitudId}`);
  return { success: true };
}
