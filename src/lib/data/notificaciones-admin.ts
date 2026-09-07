import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificacionAdmin } from "@/types/database";

// Campana de la topbar: solo admin tiene tabla de notificaciones real
// (notificaciones_admin, poblada desde lib/notificaciones/notificar-admin.ts
// en alta de abogado / nueva solicitud). Abogado y cliente no tienen tabla
// equivalente todavía, así que su campana queda sin datos por ahora.
export async function obtenerNotificacionesAdmin(limite = 8): Promise<NotificacionAdmin[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notificaciones_admin")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  return data ?? [];
}

export async function contarNotificacionesAdminNoLeidas(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notificaciones_admin")
    .select("id", { count: "exact", head: true })
    .eq("leida", false);
  return count ?? 0;
}
