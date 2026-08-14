import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarReseteoPassword } from "@/lib/email/enviar";
import { getSiteUrl } from "@/lib/site-url";

// Genera el link de reseteo con `supabase.auth.admin` (service role, nunca
// en el cliente) y lo envía con el template propio de Resend — nunca con el
// email por defecto de Supabase. Usado tanto por el self-service público
// ("olvidé mi contraseña") como por el botón "Restablecer contraseña" del
// panel de Administrador (2.a).
export async function generarYEnviarReseteoPassword(
  email: string
): Promise<{ ok: boolean }> {
  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("nombre_completo")
    .eq("email", email)
    .maybeSingle();

  // Si el email no corresponde a ninguna cuenta, generateLink va a fallar:
  // lo tragamos silenciosamente para no revelar qué emails existen.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${getSiteUrl()}/auth/confirm?next=/actualizar-password` },
  });

  if (error || !data?.properties?.action_link) {
    return { ok: false };
  }

  await enviarReseteoPassword({
    email,
    nombreCompleto: perfil?.nombre_completo ?? email,
    linkReseteo: data.properties.action_link,
  });

  return { ok: true };
}
