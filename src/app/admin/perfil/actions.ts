"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { adminPerfilSchema } from "@/lib/validation/admin.schema";

type ResultadoAccion = { success: true } | { success: false; error: string };

export async function actualizarPerfilAdmin(input: unknown): Promise<ResultadoAccion> {
  const { user } = await requireRole("admin");
  const parsed = adminPerfilSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Revisá los datos: hay campos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre_completo: parsed.data.nombre_completo,
      telefono: parsed.data.telefono,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: "No pudimos guardar los cambios." };

  revalidatePath("/admin/perfil");
  return { success: true };
}
