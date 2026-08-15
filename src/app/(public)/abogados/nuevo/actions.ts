"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { abogadoAltaCompletoSchema } from "@/lib/validation/abogado.schema";
import { generarPdfDeclaracionJurada } from "@/lib/pdf/declaracion-jurada-pdf";
import { enviarAltaAbogadoConfirmacion } from "@/lib/email/enviar";
import { notificarAdmin } from "@/lib/notificaciones/notificar-admin";

export type CrearAbogadoResult =
  | {
      success: true;
      abogado: {
        id: string;
        nombre_completo: string;
        provincia: string;
        fecha_alta: string;
        especialidades: string[];
      };
    }
  | { success: false; error: string };

export async function crearAbogado(
  input: unknown
): Promise<CrearAbogadoResult> {
  const parsed = abogadoAltaCompletoSchema.safeParse(input);
  if (!parsed.success) {
    console.error("[crearAbogado] validación falló:", JSON.stringify(parsed.error.issues));
    return {
      success: false,
      error: "Revisá los datos del formulario: hay campos inválidos.",
    };
  }

  const datos = parsed.data;
  // Server Action ya validada con Zod arriba y con estado/user_id hardcodeados
  // acá mismo (nunca vienen del cliente) — el gatekeeper real es este código,
  // no la RLS. Se usa el cliente admin porque un INSERT ... RETURNING de un
  // abogado 'pendiente' sin user_id no pasa ninguna policy de SELECT como
  // rol anon (a propósito: no hay que exponer pendientes), y Postgres
  // reporta esa combinación como si fallara el propio INSERT.
  const supabase = createAdminClient();
  const { data: abogado, error: errorInsert } = await supabase
    .from("abogados")
    .insert({
      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono,
      direccion: datos.direccion,
      provincia: datos.provincia,
      localidad: datos.localidad,
      codigo_postal: datos.codigo_postal || null,
      matricula_federal: datos.matricula_federal || null,
      matricula_provincial: datos.matricula_provincial || null,
      email: datos.email,
      estado: "pendiente",
      user_id: null,
      acepto_declaracion_jurada: true,
      fecha_aceptacion_dj: new Date().toISOString(),
    })
    .select("id, nombre_completo, provincia, fecha_alta")
    .single();

  if (errorInsert || !abogado) {
    console.error("[crearAbogado] insert abogados falló:", errorInsert);
    const esDuplicado = errorInsert?.code === "23505";
    return {
      success: false,
      error: esDuplicado
        ? "Ese email ya está registrado en la red PROBONO."
        : "No pudimos guardar tu inscripción. Probá de nuevo en un momento.",
    };
  }

  const { error: errorEspecialidades } = await supabase
    .from("abogado_especialidades")
    .insert(
      datos.especialidad_ids.map((especialidad_id) => ({
        abogado_id: abogado.id,
        especialidad_id,
      }))
    );

  if (errorEspecialidades) {
    console.error("[crearAbogado] insert abogado_especialidades falló:", errorEspecialidades);
    return {
      success: false,
      error: "No pudimos guardar tus áreas de actuación. Probá de nuevo.",
    };
  }

  // Generar el PDF de la Declaración Jurada aceptada y subirlo al bucket
  // privado. Si esto falla no abortamos el alta (ya quedó guardada); el
  // admin puede regenerarlo/gestionarlo desde su panel más adelante.
  try {
    const pdfBuffer = await generarPdfDeclaracionJurada({
      nombreCompleto: datos.nombre_completo,
      email: datos.email,
      provincia: datos.provincia,
      matriculaFederal: datos.matricula_federal,
      matriculaProvincial: datos.matricula_provincial,
      fechaAceptacion: new Date(),
    });

    const rutaPdf = `${abogado.id}/declaracion-jurada.pdf`;
    const { error: errorUpload } = await supabase.storage
      .from("declaraciones-juradas")
      .upload(rutaPdf, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (!errorUpload) {
      await supabase
        .from("abogados")
        .update({ declaracion_jurada_pdf_url: rutaPdf })
        .eq("id", abogado.id);
    }
  } catch {
    // No bloqueante — ver comentario arriba.
  }

  await notificarAdmin({
    tipo: "nuevo_abogado",
    titulo: "Nuevo abogado inscripto",
    mensaje: `${datos.nombre_completo} (${datos.provincia}) se inscribió a la red PROBONO y espera aprobación.`,
    entidadId: abogado.id,
  });

  const { data: especialidadesData } = await supabase
    .from("especialidades")
    .select("nombre")
    .in("id", datos.especialidad_ids);

  const nombresEspecialidades = (especialidadesData ?? []).map((e) => e.nombre);

  try {
    await enviarAltaAbogadoConfirmacion({
      email: datos.email,
      nombreCompleto: datos.nombre_completo,
      provincia: datos.provincia,
      especialidades: nombresEspecialidades,
    });
  } catch {
    // No bloqueante — el alta ya quedó guardada.
  }

  return {
    success: true,
    abogado: {
      id: abogado.id,
      nombre_completo: abogado.nombre_completo,
      provincia: abogado.provincia,
      fecha_alta: abogado.fecha_alta,
      especialidades: nombresEspecialidades,
    },
  };
}
