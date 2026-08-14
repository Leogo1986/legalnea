"use client";

import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <div>
              <CardTitle>{s.cliente_nombre}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {s.cliente_email} · {s.cliente_telefono} · {s.cliente_provincia}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline">{s.estado.replace("_", " ")}</Badge>
              <Badge variant="outline">{s.prioridad}</Badge>
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
            <p className="text-xs text-muted-foreground">
              Recibida el {formatearFecha(s.created_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
