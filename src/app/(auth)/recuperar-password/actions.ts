"use server";

import { recuperarPasswordSchema } from "@/lib/validation/auth.schema";
import { generarYEnviarReseteoPassword } from "@/lib/auth/enviar-reseteo";

// Siempre responde con éxito genérico, exista o no el email, para no
// revelar qué cuentas están registradas.
export async function solicitarRecuperacion(input: unknown): Promise<{ ok: boolean }> {
  const parsed = recuperarPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: true };

  await generarYEnviarReseteoPassword(parsed.data.email);
  return { ok: true };
}
