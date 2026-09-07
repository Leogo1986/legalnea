import type { EstadoSolicitud, Prioridad } from "@/types/database";

// Colores de badge por estado/prioridad de una solicitud — centralizados acá
// para que admin (tabla-solicitudes.tsx), abogado (lista-solicitudes-abogado.tsx)
// y cliente (tarjeta-solicitud-cliente.tsx) muestren siempre la misma
// semántica visual (antes cada uno tenía su propia copia del mapa).
export const ESTILO_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  nueva: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  en_revision: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  asignada: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  en_curso: "bg-primary/15 text-primary",
  resuelta: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  derivada: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  cerrada: "bg-muted text-muted-foreground",
  anulada: "bg-muted text-muted-foreground",
  rechazada: "bg-destructive/15 text-destructive",
};

export const ESTILO_PRIORIDAD_SOLICITUD: Record<Prioridad, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  alta: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  urgente: "bg-destructive/15 text-destructive",
};

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
