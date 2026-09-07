import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ESTILO_ESTADO_SOLICITUD } from "@/lib/estilos-estado";
import type { EstadoSolicitud } from "@/types/database";

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
              <Badge className={ESTILO_ESTADO_SOLICITUD[solicitud.estado]}>
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
