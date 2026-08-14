import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { ADMIN_EMAIL } from "@/lib/constants";

// Notificación interna (tabla admin-only, badge del panel) + email opcional
// a una casilla configurable (ADMIN_NOTIFICATION_EMAIL) para no depender
// solo de que el admin esté mirando el panel — ver prompt maestro, sección 8.
export async function notificarAdmin(opts: {
  tipo: "nuevo_abogado" | "nueva_solicitud";
  titulo: string;
  mensaje: string;
  entidadId: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("notificaciones_admin").insert({
      tipo: opts.tipo,
      titulo: opts.titulo,
      mensaje: opts.mensaje,
      entidad_id: opts.entidadId,
    });
  } catch {
    // No bloqueante.
  }

  const destinatario = process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;
  try {
    await enviarEmail({
      to: destinatario,
      subject: opts.titulo,
      html: `<p>${opts.mensaje}</p>`,
    });
  } catch {
    // No bloqueante.
  }
}
