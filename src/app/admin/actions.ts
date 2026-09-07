"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

// Marca todas las notificaciones admin como leídas (se llama al abrir el
// dropdown de la campana en la topbar — ver components/layout/app-shell.tsx).
export async function marcarNotificacionesLeidas(): Promise<{ success: boolean }> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin.from("notificaciones_admin").update({ leida: true }).eq("leida", false);
  if (error) return { success: false };

  revalidatePath("/admin", "layout");
  return { success: true };
}
