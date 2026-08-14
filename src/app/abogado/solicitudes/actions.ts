"use server";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

// Cliente con la sesión del propio abogado (no admin): la RLS de
// storage.objects ya garantiza que solo pueda firmar adjuntos de
// solicitudes donde es el abogado asignado.
export async function obtenerUrlFirmadaPropia(
  rutaStorage: string
): Promise<{ url: string | null }> {
  await requireRole("abogado");
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("adjuntos-solicitudes")
    .createSignedUrl(rutaStorage, 60 * 5);

  if (error || !data) return { url: null };
  return { url: data.signedUrl };
}
