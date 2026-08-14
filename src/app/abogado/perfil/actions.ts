"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { abogadoAltaSchema } from "@/lib/validation/abogado.schema";

type ResultadoAccion = { success: true } | { success: false; error: string };

// El abogado puede editar sus datos de contacto excepto `estado` (MVP, ver
// prompt maestro punto 4). Se excluye también `email`: es el identificador
// de login en Supabase Auth, cambiarlo acá lo desincronizaría de
// `auth.users.email` — decisión de diseño no cubierta explícitamente en el
// prompt, tomada por ser la opción más simple y segura. `especialidad_ids`
// también queda fuera del MVP de edición de perfil (fijo tras la aprobación).
const editarPerfilSchema = abogadoAltaSchema.omit({ especialidad_ids: true, email: true });

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
      direccion: datos.direccion,
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
