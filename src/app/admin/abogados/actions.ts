"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarAltaAbogadoRechazado } from "@/lib/email/enviar";
import { vincularCuentaAbogado } from "@/lib/auth/vincular-cuenta-abogado";
import { generarPasswordApartirDeNombre } from "@/lib/auth/generar-password";

type ResultadoAccion = { success: true } | { success: false; error: string };
type ResultadoConClave =
  | { success: true; password?: string }
  | { success: false; error: string };

// Aprueba el alta de un abogado. La cuenta de Auth se crea/vincula recién
// acá (ver lib/auth/vincular-cuenta-abogado.ts) con una clave determinística
// que se devuelve para que el admin la mande por WhatsApp — antes se usaba
// `generateLink({type:"invite"})` + mail de Resend, pero sin Resend
// configurado el abogado quedaba aprobado sin enterarse ni poder loguear.
export async function aprobarAbogado(abogadoId: string): Promise<ResultadoConClave> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: abogado, error: errorGet } = await admin
    .from("abogados")
    .select("id, nombre_completo, email, estado, user_id")
    .eq("id", abogadoId)
    .single();

  if (errorGet || !abogado) return { success: false, error: "Abogado no encontrado." };
  if (abogado.estado === "aprobado") return { success: true };

  let password: string | undefined;
  if (!abogado.user_id) {
    // vincularCuentaAbogado ya deja escrito abogados.user_id — el update de
    // abajo no lo toca para no pisarlo con el valor viejo (null) de `abogado`.
    const res = await vincularCuentaAbogado(admin, abogado.id, abogado.email, abogado.nombre_completo);
    if (res.error) return { success: false, error: res.error };
    password = res.password ?? undefined;
  }

  const { error: errorUpdate } = await admin
    .from("abogados")
    .update({
      estado: "aprobado",
      aprobado_por: user.id,
      fecha_aprobacion: new Date().toISOString(),
      motivo_rechazo: null,
    })
    .eq("id", abogadoId);

  if (errorUpdate) return { success: false, error: "No pudimos aprobar al abogado." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "aprobar_abogado",
    entidad: "abogados",
    entidad_id: abogadoId,
  });

  revalidatePath("/admin/abogados");
  revalidatePath("/abogados/nuevo");
  return { success: true, password };
}

export async function rechazarAbogado(
  abogadoId: string,
  motivo: string
): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: abogado, error: errorGet } = await admin
    .from("abogados")
    .select("nombre_completo, email")
    .eq("id", abogadoId)
    .single();

  if (errorGet || !abogado) return { success: false, error: "Abogado no encontrado." };

  const { error: errorUpdate } = await admin
    .from("abogados")
    .update({ estado: "rechazado", motivo_rechazo: motivo || null })
    .eq("id", abogadoId);

  if (errorUpdate) return { success: false, error: "No pudimos rechazar al abogado." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "rechazar_abogado",
    entidad: "abogados",
    entidad_id: abogadoId,
    detalle: { motivo },
  });

  try {
    await enviarAltaAbogadoRechazado({
      email: abogado.email,
      nombreCompleto: abogado.nombre_completo,
      motivo,
    });
  } catch {
    // No bloqueante.
  }

  revalidatePath("/admin/abogados");
  return { success: true };
}

export async function suspenderAbogado(abogadoId: string): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("abogados")
    .update({ estado: "inactivo" })
    .eq("id", abogadoId);

  if (error) return { success: false, error: "No pudimos suspender al abogado." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "suspender_abogado",
    entidad: "abogados",
    entidad_id: abogadoId,
  });

  revalidatePath("/admin/abogados");
  revalidatePath("/abogados/nuevo");
  return { success: true };
}

export async function reactivarAbogado(abogadoId: string): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("abogados")
    .update({ estado: "aprobado" })
    .eq("id", abogadoId);

  if (error) return { success: false, error: "No pudimos reactivar al abogado." };

  await admin.from("logs_auditoria").insert({
    usuario_id: user.id,
    accion: "reactivar_abogado",
    entidad: "abogados",
    entidad_id: abogadoId,
  });

  revalidatePath("/admin/abogados");
  revalidatePath("/abogados/nuevo");
  return { success: true };
}

// Genera y setea una clave nueva directo por Auth admin (sin mail/Resend de
// por medio) para un abogado que YA tiene cuenta — mismo mecanismo que
// generarClaveClienteExistente en admin/solicitudes/actions.ts, para mandarla
// por WhatsApp. Reemplaza al viejo resetearPasswordAbogado (Resend-based).
export async function generarClaveAbogadoExistente(email: string): Promise<ResultadoConClave> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("id, nombre_completo")
    .eq("email", email)
    .maybeSingle();

  if (!perfil) {
    return { success: false, error: "Ese abogado todavía no tiene cuenta (aprobá su alta primero)." };
  }

  const password = await generarPasswordApartirDeNombre(admin, perfil.nombre_completo, perfil.id, "abogado");
  const { error } = await admin.auth.admin.updateUserById(perfil.id, { password });

  if (error) return { success: false, error: "No pudimos generar la clave." };
  return { success: true, password };
}

export async function obtenerUrlFirmadaDj(rutaStorage: string): Promise<{ url: string | null }> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from("declaraciones-juradas")
    .createSignedUrl(rutaStorage, 60 * 5);

  if (error || !data) return { url: null };
  return { url: data.signedUrl };
}

