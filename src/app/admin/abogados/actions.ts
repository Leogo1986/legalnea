"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarAltaAbogadoAprobado, enviarAltaAbogadoRechazado } from "@/lib/email/enviar";
import { generarYEnviarReseteoPassword } from "@/lib/auth/enviar-reseteo";
import { getSiteUrl } from "@/lib/site-url";

type ResultadoAccion = { success: true } | { success: false; error: string };

export async function aprobarAbogado(abogadoId: string): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: abogado, error: errorGet } = await admin
    .from("abogados")
    .select("id, nombre_completo, email, estado, user_id")
    .eq("id", abogadoId)
    .single();

  if (errorGet || !abogado) return { success: false, error: "Abogado no encontrado." };
  if (abogado.estado === "aprobado") return { success: true };

  let authUserId = abogado.user_id;

  if (!authUserId) {
    const { data: invitado, error: errorInvite } = await admin.auth.admin.generateLink({
      type: "invite",
      email: abogado.email,
      options: { redirectTo: `${getSiteUrl()}/auth/confirm?next=/activar-cuenta` },
    });

    if (errorInvite || !invitado?.user) {
      return { success: false, error: "No pudimos crear la cuenta del abogado." };
    }

    authUserId = invitado.user.id;

    // generateLink({type:"invite"}) crea la cuenta sin confirmar: el email
    // recién queda confirmado cuando el usuario clickea el link del mail de
    // invitación. Si el envío de mail falla o no está configurado (Resend),
    // la cuenta queda confirmable para siempre y el abogado no puede loguear
    // ni con la password que le resetee el admin. La aprobación del admin ya
    // es el gate real acá, así que confirmamos el email nosotros mismos.
    await admin.auth.admin.updateUserById(authUserId, { email_confirm: true });

    await admin.from("perfiles").upsert({
      id: authUserId,
      rol: "abogado",
      nombre_completo: abogado.nombre_completo,
      email: abogado.email,
    });

    await enviarAltaAbogadoAprobado({
      email: abogado.email,
      nombreCompleto: abogado.nombre_completo,
      linkActivacion: invitado.properties.action_link,
    });
  }

  const { error: errorUpdate } = await admin
    .from("abogados")
    .update({
      estado: "aprobado",
      user_id: authUserId,
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
  return { success: true };
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

export async function resetearPasswordAbogado(email: string): Promise<ResultadoAccion> {
  await requireRole("admin");
  const res = await generarYEnviarReseteoPassword(email);
  if (!res.ok) return { success: false, error: res.error ?? "No pudimos generar el link de reseteo." };
  return { success: true };
}

