import "server-only";
import { Resend } from "resend";

// Cliente Resend para todo el email transaccional de negocio (nunca el
// servicio de email por defecto de Supabase — ver prompt maestro, punto 2
// de "Decisiones técnicas ya cerradas").
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Legal Nea Soft <onboarding@resend.dev>";

export async function enviarEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    // Sin RESEND_API_KEY configurada (dev local sin credenciales): no
    // rompemos el flujo, solo lo dejamos registrado en consola del server.
    console.warn(
      `[email] RESEND_API_KEY no configurada — no se envió "${opts.subject}" a ${opts.to}`
    );
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[email] error al enviar", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
