"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { componerDireccion } from "@/lib/domicilio";
import { clienteEditarSchema } from "@/lib/validation/cliente.schema";

type ResultadoAccion = { success: true } | { success: false; error: string };

export async function actualizarPerfilCliente(input: unknown): Promise<ResultadoAccion> {
  const { user } = await requireRole("cliente");
  const parsed = clienteEditarSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Revisá los datos: hay campos inválidos." };
  }

  const supabase = await createClient();
  const datos = parsed.data;

  const { error } = await supabase
    .from("clientes")
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
    })
    .eq("user_id", user.id);

  if (error) return { success: false, error: "No pudimos guardar los cambios." };

  revalidatePath("/cliente/perfil");
  return { success: true };
}
