import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const RANGO_DIACRITICOS = /[̀-ͯ]/g;

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(RANGO_DIACRITICOS, "");
}

function normalizarNombre(texto: string): string {
  return quitarAcentos(texto).trim().toLowerCase();
}

function capitalizar(palabra: string): string {
  if (!palabra) return palabra;
  return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
}

// Clave predecible para mandar por WhatsApp (pedido explícito del usuario,
// a costa de seguridad — no es aleatoria a propósito): primer nombre con
// mayúscula inicial + año actual, ej. "Peperino2026". Si ya hay otro cliente
// con el mismo primer nombre, antepone un número para no repetir clave
// entre personas distintas: el segundo "Peperino" es "2Peperino2026", el
// tercero "3Peperino2026", etc. `excluirUserId` es para cuando se está
// regenerando la clave de una cuenta que ya existe (no hay que contarla
// a sí misma como "otro" Peperino).
export async function generarPasswordApartirDeNombre(
  admin: AdminClient,
  nombreCompleto: string,
  excluirUserId?: string
): Promise<string> {
  const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || "Cliente";
  const anio = new Date().getFullYear();

  const { data: perfiles } = await admin
    .from("perfiles")
    .select("id, nombre_completo")
    .eq("rol", "cliente");

  const coincidencias = (perfiles ?? []).filter((p) => {
    if (excluirUserId && p.id === excluirUserId) return false;
    const otroPrimerNombre = (p.nombre_completo ?? "").trim().split(/\s+/)[0] ?? "";
    return normalizarNombre(otroPrimerNombre) === normalizarNombre(primerNombre);
  });

  const prefijo = coincidencias.length > 0 ? String(coincidencias.length + 1) : "";
  return `${prefijo}${capitalizar(primerNombre)}${anio}`;
}
