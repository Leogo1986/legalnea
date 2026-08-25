"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { componerDireccion } from "@/lib/domicilio";
import {
  abogadoDatosSchema,
  validarAlMenosUnaMatricula,
  REFINEMENT_MATRICULA,
} from "@/lib/validation/abogado.schema";

type ResultadoAccion = { success: true } | { success: false; error: string };

// El abogado puede editar sus datos de contacto excepto `estado` (MVP, ver
// prompt maestro punto 4). Se excluye también `email`: es el identificador
// de login en Supabase Auth, cambiarlo acá lo desincronizaría de
// `auth.users.email` — decisión de diseño no cubierta explícitamente en el
// prompt, tomada por ser la opción más simple y segura. `especialidad_ids`
// también queda fuera del MVP de edición de perfil (fijo tras la aprobación).
// (Se parte de `abogadoDatosSchema`, no de `abogadoAltaSchema`: Zod no deja
// `.omit()` sobre un schema ya refinado.)
const editarPerfilSchema = abogadoDatosSchema
  .omit({ especialidad_ids: true, email: true })
  .refine(validarAlMenosUnaMatricula, REFINEMENT_MATRICULA);

export async function actualizarPerfilAbogado(input: unknown): Promise<ResultadoAccion> {
  const { user } = await requireRole("abogado");
  const parsed = editarPerfilSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Revisá los datos: hay campos inválidos." };
  }

  const supabase = await createClient();
  const datos = parsed.data;

  const { error } = await supabase
    .from("abogados")
    .update({
      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono,
      calle: datos.calle,
      altura: datos.altura,
      piso: datos.piso || null,
      dpto: datos.dpto || null,
      direccion: componerDireccion(datos),
      provincia: datos.provincia,
      localidad: datos.localidad,
      codigo_postal: datos.codigo_postal || null,
      matricula_federal: datos.matricula_federal || null,
      matricula_provincial: datos.matricula_provincial || null,
    })
    .eq("user_id", user.id);

  if (error) return { success: false, error: "No pudimos guardar los cambios." };

  revalidatePath("/abogado/perfil");
  return { success: true };
}
