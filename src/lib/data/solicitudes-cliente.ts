import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSolicitud } from "@/types/database";

export type SolicitudResumen = {
  id: string;
  motivo_consulta: string;
  estado: EstadoSolicitud;
  created_at: string;
  abogadoNombre: string | null;
};

// Estados que ya no requieren seguimiento activo del cliente — usado para
// separar "en curso" de "resueltas" en el dashboard.
const ESTADOS_FINALIZADOS: EstadoSolicitud[] = [
  "resuelta",
  "cerrada",
  "anulada",
  "rechazada",
  "derivada",
];

export async function obtenerClienteDeUsuario(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("id").eq("user_id", userId).single();
  return data;
}

export async function obtenerSolicitudesCliente(clienteId: string): Promise<SolicitudResumen[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes")
    .select("id, motivo_consulta, estado, created_at, abogados(nombre_completo)")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((s) => {
    const abogado = s.abogados as unknown as { nombre_completo: string } | null;
    return {
      id: s.id,
      motivo_consulta: s.motivo_consulta,
      estado: s.estado,
      created_at: s.created_at,
      abogadoNombre: abogado?.nombre_completo ?? null,
    };
  });
}

export function calcularKpisCliente(solicitudes: SolicitudResumen[]) {
  const total = solicitudes.length;
  const finalizadas = solicitudes.filter((s) => ESTADOS_FINALIZADOS.includes(s.estado)).length;
  const enCurso = total - finalizadas;
  const resueltas = solicitudes.filter((s) => s.estado === "resuelta").length;
  return { total, enCurso, resueltas };
}
