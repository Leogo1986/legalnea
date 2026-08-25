"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Download, Loader2, Paperclip, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineCaso } from "@/components/casos/timeline-caso";
import { cn } from "@/lib/utils";
import type { EstadoSolicitud, Rol } from "@/types/database";
import { agregarAdjuntoPropio, obtenerUrlFirmadaCliente } from "@/app/cliente/solicitudes/actions";
import { ESTADO_LABEL_CLIENTE } from "@/components/cliente/tarjeta-solicitud-cliente";

const PASOS: { estado: EstadoSolicitud; label: string }[] = [
  { estado: "nueva", label: "Recibida" },
  { estado: "en_revision", label: "En revisión" },
  { estado: "asignada", label: "Asignada" },
  { estado: "en_curso", label: "En curso" },
  { estado: "resuelta", label: "Resuelta" },
];

type Solicitud = {
  id: string;
  motivo_consulta: string;
  estado: EstadoSolicitud;
  created_at: string;
  abogadoNombre: string | null;
  adjuntos: { id: string; nombre: string; ruta: string }[];
  // El chat es solo admin↔abogado por ahora (el cliente no lo ve todavía),
  // pero la solicitud igual trae `mensajes` del server — se deja el campo
  // por si se reactiva más adelante, simplemente no se renderiza acá.
  eventos: { id: string; etapa: string; nota: string | null; autorRol: Rol; createdAt: string }[];
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

export function SolicitudCliente({ solicitud }: { solicitud: Solicitud }) {
  const [subiendoArchivo, setSubiendoArchivo] = React.useState(false);
  const inputArchivoRef = React.useRef<HTMLInputElement>(null);

  const esTerminalAlterno =
    solicitud.estado === "derivada" ||
    solicitud.estado === "cerrada" ||
    solicitud.estado === "rechazada" ||
    solicitud.estado === "anulada";
  const pasoActual = PASOS.findIndex((p) => p.estado === solicitud.estado);

  async function subirArchivo(file: File) {
    setSubiendoArchivo(true);
    const formData = new FormData();
    formData.set("solicitud_id", solicitud.id);
    formData.set("archivo", file);
    const res = await agregarAdjuntoPropio(formData);
    setSubiendoArchivo(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Archivo adjuntado.");
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  }

  async function descargar(ruta: string) {
    const { url } = await obtenerUrlFirmadaCliente(ruta);
    if (!url) {
      toast.error("No pudimos generar el link de descarga.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-br from-primary/8 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Solicitud del {formatearFecha(solicitud.created_at)}</CardTitle>
          {esTerminalAlterno && (
            <Badge variant="outline">{ESTADO_LABEL_CLIENTE[solicitud.estado]}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {!esTerminalAlterno && (
          <ol className="flex flex-wrap gap-x-1 gap-y-2">
            {PASOS.map((paso, i) => {
              const completado = i <= pasoActual;
              return (
                <li key={paso.estado} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                      completado
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {completado && <Check className="size-3" />}
                    {paso.label}
                  </span>
                  {i < PASOS.length - 1 && <span className="text-muted-foreground">→</span>}
                </li>
              );
            })}
          </ol>
        )}

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">{solicitud.motivo_consulta}</div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <UserRound className="size-4 text-muted-foreground" />
          {solicitud.abogadoNombre
            ? `Abogado asignado: ${solicitud.abogadoNombre}`
            : "Todavía no te asignamos un abogado."}
        </div>

        {solicitud.adjuntos.length > 0 && (
          <div className="grid gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Adjuntos</p>
            <div className="flex flex-wrap gap-2">
              {solicitud.adjuntos.map((a) => (
                <Button key={a.id} variant="outline" size="sm" onClick={() => descargar(a.ruta)}>
                  <Download className="size-3.5" />
                  {a.nombre}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="w-fit cursor-pointer text-xs font-medium text-muted-foreground underline underline-offset-2">
            <input
              ref={inputArchivoRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])}
            />
            {subiendoArchivo ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" /> Subiendo...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Paperclip className="size-3.5" /> Adjuntar otro archivo
              </span>
            )}
          </label>
        </div>

        {solicitud.eventos.length > 0 && (
          <div className="grid gap-2 rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Línea de tiempo del trámite</p>
            <TimelineCaso eventos={solicitud.eventos} soloLectura />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
