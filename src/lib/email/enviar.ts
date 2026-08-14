import "server-only";
import { render } from "@react-email/render";
import { enviarEmail } from "./resend";
import { AltaAbogadoConfirmacionEmail } from "./templates/alta-abogado-confirmacion";
import { AltaAbogadoAprobadoEmail } from "./templates/alta-abogado-aprobado";
import { AltaAbogadoRechazadoEmail } from "./templates/alta-abogado-rechazado";
import { AltaClienteConfirmacionEmail } from "./templates/alta-cliente-confirmacion";
import { ReseteoPasswordEmail } from "./templates/reseteo-password";
import { MensajeAdminEmail } from "./templates/mensaje-admin";

export async function enviarAltaAbogadoConfirmacion(datos: {
  email: string;
  nombreCompleto: string;
  provincia: string;
  especialidades: string[];
}) {
  const html = await render(AltaAbogadoConfirmacionEmail(datos));
  return enviarEmail({
    to: datos.email,
    subject: "Recibimos tu solicitud para sumarte a la Red PROBONO",
    html,
  });
}

export async function enviarAltaAbogadoAprobado(datos: {
  email: string;
  nombreCompleto: string;
  linkActivacion: string;
}) {
  const html = await render(AltaAbogadoAprobadoEmail(datos));
  return enviarEmail({
    to: datos.email,
    subject: "¡Tu inscripción a la Red PROBONO fue aprobada!",
    html,
  });
}

export async function enviarAltaAbogadoRechazado(datos: {
  email: string;
  nombreCompleto: string;
  motivo?: string | null;
}) {
  const html = await render(AltaAbogadoRechazadoEmail(datos));
  return enviarEmail({
    to: datos.email,
    subject: "Novedades sobre tu inscripción a la Red PROBONO",
    html,
  });
}

export async function enviarAltaClienteConfirmacion(datos: {
  email: string;
  nombreCompleto: string;
  solicitudId: string;
}) {
  const html = await render(AltaClienteConfirmacionEmail(datos));
  return enviarEmail({
    to: datos.email,
    subject: "Recibimos tu solicitud de asistencia jurídica gratuita",
    html,
  });
}

export async function enviarReseteoPassword(datos: {
  email: string;
  nombreCompleto: string;
  linkReseteo: string;
}) {
  const html = await render(ReseteoPasswordEmail(datos));
  return enviarEmail({
    to: datos.email,
    subject: "Restablecé tu contraseña de Legal Nea Soft",
    html,
  });
}

export async function enviarMensajeAdmin(datos: {
  email: string;
  nombreDestinatario: string;
  mensaje: string;
  linkPanel: string;
}) {
  const html = await render(MensajeAdminEmail(datos));
  return enviarEmail({
    to: datos.email,
    subject: "Tenés un nuevo mensaje en Legal Nea Soft",
    html,
  });
}
