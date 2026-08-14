"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { validarArchivoAdjunto } from "@/lib/validation/cliente.schema";

type ResultadoAccion = { success: true } | { success: false; error: string };

async function verificarPropiaSolicitud(solicitudId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes")
    .select("id, clientes!inner(user_id)")
    .eq("id", solicitudId)
    .eq("clientes.user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function agregarAdjuntoPropio(formData: FormData): Promise<ResultadoAccion> {
  const { user } = await requireRole("cliente");
  const solicitudId = String(formData.get("solicitud_id") ?? "");
  const archivo = formData.get("archivo");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { success: false, error: "Elegí un archivo." };
  }
  const errorArchivo = validarArchivoAdjunto(archivo);
  if (errorArchivo) return { success: false, error: errorArchivo };

  if (!(await verificarPropiaSolicitud(solicitudId, user.id))) {
    return { success: false, error: "Esa solicitud no te pertenece." };
  }

  const supabase = await createClient();
  const ruta = `${solicitudId}/${crypto.randomUUID()}-${archivo.name}`;

  const { error: errorUpload } = await supabase.storage
    .from("adjuntos-solicitudes")
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (errorUpload) return { success: false, error: "No pudimos subir el archivo." };

  const { error: errorInsert } = await supabase.from("solicitud_adjuntos").insert({
    solicitud_id: solicitudId,
    nombre_archivo: archivo.name,
    ruta_storage: ruta,
    tipo_mime: archivo.type,
    tamanio_bytes: archivo.size,
  });

  if (errorInsert) return { success: false, error: "No pudimos guardar el adjunto." };

  revalidatePath("/cliente/solicitud");
  return { success: true };
}

export async function enviarMensajeCliente(
  solicitudId: string,
  contenido: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("cliente");

  if (!contenido.trim()) return { success: false, error: "Escribí un mensaje." };
  if (!(await verificarPropiaSolicitud(solicitudId, user.id))) {
    return { success: false, error: "Esa solicitud no te pertenece." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mensajes").insert({
    solicitud_id: solicitudId,
    autor_id: user.id,
    autor_rol: "cliente",
    contenido: contenido.trim(),
  });

  if (error) return { success: false, error: "No pudimos enviar el mensaje." };

  revalidatePath("/cliente/solicitud");
  return { success: true };
}

export async function obtenerUrlFirmadaCliente(
  rutaStorage: string
): Promise<{ url: string | null }> {
  await requireRole("cliente");
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("adjuntos-solicitudes")
    .createSignedUrl(rutaStorage, 60 * 5);

  if (error || !data) return { url: null };
  return { url: data.signedUrl };
}
