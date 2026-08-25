"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  clienteAltaSchema,
  validarArchivoAdjunto,
  MAX_ARCHIVOS_SOLICITUD,
} from "@/lib/validation/cliente.schema";
import { enviarAltaClienteConfirmacion } from "@/lib/email/enviar";
import { notificarAdmin } from "@/lib/notificaciones/notificar-admin";
import { getSiteUrl } from "@/lib/site-url";

export type CrearSolicitudResult =
  | { success: true; solicitudId: string }
  | { success: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

// Crea (o vincula, si ya existe) la cuenta de Auth del cliente en el momento
// del alta — a diferencia del abogado, acá no está gateado por aprobación:
// el cliente tiene que poder loguear apenas manda su solicitud para ver su
// estado (así lo dice el propio texto de /login). Mismo fix que en
// admin/abogados/actions.ts: confirmamos el email nosotros mismos, porque
// generateLink({type:"invite"}) deja la cuenta sin confirmar hasta que se
// clickea el link del mail, y ese mail puede no llegar (Resend sin
// configurar todavía). No bloqueante: si esto falla, la solicitud ya quedó
// guardada igual y el admin puede resolverlo a mano.
async function vincularCuentaCliente(
  supabase: AdminClient,
  clienteId: string,
  email: string,
  nombreCompleto: string
) {
  try {
    const { data: perfilExistente } = await supabase
      .from("perfiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (perfilExistente) {
      await supabase.from("clientes").update({ user_id: perfilExistente.id }).eq("id", clienteId);
      return;
    }

    const { data: invitado, error: errorInvite } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: `${getSiteUrl()}/auth/confirm?next=/actualizar-password` },
    });

    if (errorInvite || !invitado?.user) return;

    await supabase.auth.admin.updateUserById(invitado.user.id, { email_confirm: true });
    await supabase.from("perfiles").upsert({
      id: invitado.user.id,
      rol: "cliente",
      nombre_completo: nombreCompleto,
      email,
    });
    await supabase.from("clientes").update({ user_id: invitado.user.id }).eq("id", clienteId);
  } catch (error) {
    console.error("[vincularCuentaCliente] no se pudo crear/vincular la cuenta:", error);
  }
}

export async function crearSolicitudCliente(
  formData: FormData
): Promise<CrearSolicitudResult> {
  const campos = {
    nombre_completo: String(formData.get("nombre_completo") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    email: String(formData.get("email") ?? ""),
    direccion: String(formData.get("direccion") ?? ""),
    provincia: String(formData.get("provincia") ?? ""),
    localidad: String(formData.get("localidad") ?? ""),
    motivo_consulta: String(formData.get("motivo_consulta") ?? ""),
    declaracion_veracidad_aceptada: formData.get("declaracion_veracidad_aceptada") === "true",
  };

  const parsed = clienteAltaSchema.safeParse(campos);
  if (!parsed.success) {
    return {
      success: false,
      error: "Revisá los datos del formulario: hay campos inválidos.",
    };
  }

  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);

  if (archivos.length > MAX_ARCHIVOS_SOLICITUD) {
    return { success: false, error: `Máximo ${MAX_ARCHIVOS_SOLICITUD} archivos adjuntos.` };
  }
  for (const archivo of archivos) {
    const errorArchivo = validarArchivoAdjunto(archivo);
    if (errorArchivo) {
      return { success: false, error: errorArchivo };
    }
  }

  const datos = parsed.data;
  // Mismo motivo que en abogados/nuevo/actions.ts: el INSERT...RETURNING de
  // un cliente/solicitud recién creada no pasa la policy de SELECT como rol
  // anon (correcto: nadie más debe poder leerla sin sesión), así que se usa
  // el cliente admin acá — la validación real ya la hizo Zod arriba.
  const supabase = createAdminClient();

  const { data: cliente, error: errorCliente } = await supabase
    .from("clientes")
    .insert({
      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono,
      email: datos.email,
      direccion: datos.direccion,
      provincia: datos.provincia,
      localidad: datos.localidad,
      user_id: null,
    })
    .select("id")
    .single();

  if (errorCliente || !cliente) {
    console.error("[crearSolicitudCliente] insert clientes falló:", errorCliente);
    return {
      success: false,
      error: "No pudimos guardar tus datos. Probá de nuevo en un momento.",
    };
  }

  await vincularCuentaCliente(supabase, cliente.id, datos.email, datos.nombre_completo);

  const { data: solicitud, error: errorSolicitud } = await supabase
    .from("solicitudes")
    .insert({
      cliente_id: cliente.id,
      motivo_consulta: datos.motivo_consulta,
      descripcion: datos.motivo_consulta,
      declaracion_veracidad_aceptada: datos.declaracion_veracidad_aceptada,
      estado: "nueva",
      prioridad: "media",
    })
    .select("id")
    .single();

  if (errorSolicitud || !solicitud) {
    console.error("[crearSolicitudCliente] insert solicitudes falló:", errorSolicitud);
    return {
      success: false,
      error: "No pudimos registrar tu solicitud. Probá de nuevo en un momento.",
    };
  }

  for (const archivo of archivos) {
    const ruta = `${solicitud.id}/${crypto.randomUUID()}-${archivo.name}`;
    const { error: errorUpload } = await supabase.storage
      .from("adjuntos-solicitudes")
      .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

    if (!errorUpload) {
      await supabase.from("solicitud_adjuntos").insert({
        solicitud_id: solicitud.id,
        nombre_archivo: archivo.name,
        ruta_storage: ruta,
        tipo_mime: archivo.type,
        tamanio_bytes: archivo.size,
      });
    }
    // Si un archivo puntual falla la subida no abortamos toda la solicitud
    // (ya quedó registrada); el resto de los adjuntos sigue su curso.
  }

  await notificarAdmin({
    tipo: "nueva_solicitud",
    titulo: "Nueva solicitud de asistencia jurídica",
    mensaje: `${datos.nombre_completo} (${datos.provincia}) pidió asistencia legal gratuita.`,
    entidadId: solicitud.id,
  });

  try {
    await enviarAltaClienteConfirmacion({
      email: datos.email,
      nombreCompleto: datos.nombre_completo,
      solicitudId: solicitud.id,
    });
  } catch {
    // No bloqueante — la solicitud ya quedó guardada.
  }

  return { success: true, solicitudId: solicitud.id };
}
