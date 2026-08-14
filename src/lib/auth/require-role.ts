import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database";

// Defense-in-depth: el proxy (middleware) ya protege /admin, /abogado y
// /cliente por rol, pero cada Server Function verifica de nuevo acá (no hay
// que confiar solo en el proxy — ver node_modules/next/dist/docs proxy.md).
export async function requireRole(rolRequerido: Rol) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, rol, nombre_completo, email")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.rol !== rolRequerido) redirect("/");

  return { user, perfil };
}
