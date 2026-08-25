import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EstadoSolicitud } from "@/types/database";

// Estilo de badge por estado — mismo criterio de color que se usa en el
// panel de admin (tabla-solicitudes.tsx) para que el cliente vea la misma
// semántica de colores en todas partes.
const ESTILO_ESTADO: Record<EstadoSolicitud, string> = {
  nueva: "text-amber-600 border-amber-300",
  en_revision: "text-blue-600 border-blue-300",
  asignada: "text-violet-600 border-violet-300",
  en_curso: "text-primary border-primary/30",
  resuelta: "text-emerald-600 border-emerald-300",
  derivada: "text-violet-600 border-violet-300",
  cerrada: "text-muted-foreground",
  anulada: "text-muted-foreground",
  rechazada: "text-destructive border-destructive/30",
};

export const ESTADO_LABEL_CLIENTE: Record<EstadoSolicitud, string> = {
  nueva: "Recibida",
  en_revision: "En revisión",
  asignada: "Asignada",
  en_curso: "En curso",
  resuelta: "Resuelta",
  derivada: "Derivada",
  cerrada: "Cerrada",
  anulada: "Anulada",
  rechazada: "No aprobada",
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

export function TarjetaSolicitudCliente({
  solicitud,
}: {
  solicitud: {
    id: string;
    motivo_consulta: string;
    estado: EstadoSolicitud;
    created_at: string;
    abogadoNombre: string | null;
  };
}) {
  return (
    <Link href={`/cliente/solicitudes/${solicitud.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={ESTILO_ESTADO[solicitud.estado]}>
                {ESTADO_LABEL_CLIENTE[solicitud.estado]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatearFecha(solicitud.created_at)}
              </span>
            </div>
            <p className="truncate text-sm">{solicitud.motivo_consulta}</p>
            {solicitud.abogadoNombre && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <UserRound className="size-3" /> {solicitud.abogadoNombre}
              </p>
            )}
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
