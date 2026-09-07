"use client";

import Link from "next/link";
import { Download, Eye, Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESTILO_ESTADO_SOLICITUD, ESTILO_PRIORIDAD_SOLICITUD, iniciales } from "@/lib/estilos-estado";
import type { EstadoSolicitud, Prioridad } from "@/types/database";
import { obtenerUrlFirmadaPropia } from "@/app/abogado/solicitudes/actions";
import { toast } from "sonner";

type Solicitud = {
  id: string;
  motivo_consulta: string;
  estado: EstadoSolicitud;
  prioridad: Prioridad;
  created_at: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  cliente_provincia: string;
  adjuntos: { id: string; nombre: string; ruta: string }[];
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(fecha));
}

export function ListaSolicitudesAbogado({ solicitudes }: { solicitudes: Solicitud[] }) {
  async function descargar(ruta: string) {
    const { url } = await obtenerUrlFirmadaPropia(ruta);
    if (!url) {
      toast.error("No pudimos generar el link de descarga.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (solicitudes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Todavía no tenés solicitudes asignadas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {solicitudes.map((s) => (
        <Card key={s.id}>
          <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
            <div className="flex items-start gap-3">
              <Avatar className="mt-0.5 shrink-0">
                <AvatarFallback>{iniciales(s.cliente_nombre)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{s.cliente_nombre}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3" /> {s.cliente_email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" /> {s.cliente_telefono}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {s.cliente_provincia}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge className={ESTILO_ESTADO_SOLICITUD[s.estado]}>{s.estado.replace("_", " ")}</Badge>
              <Badge className={ESTILO_PRIORIDAD_SOLICITUD[s.prioridad]}>{s.prioridad}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{s.motivo_consulta}</p>
            {s.adjuntos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {s.adjuntos.map((a) => (
                  <Button
                    key={a.id}
                    variant="outline"
                    size="sm"
                    onClick={() => descargar(a.ruta)}
                  >
                    <Download className="size-3.5" />
                    {a.nombre}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Recibida el {formatearFecha(s.created_at)}
              </p>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/abogado/solicitudes/${s.id}`} />}
              >
                <Eye className="size-3.5" />
                Ver caso
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
