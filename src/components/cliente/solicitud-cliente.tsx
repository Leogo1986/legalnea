"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Download, Loader2, Paperclip, Send, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TimelineCaso } from "@/components/casos/timeline-caso";
import { cn } from "@/lib/utils";
import type { EstadoSolicitud, Rol } from "@/types/database";
import {
  agregarAdjuntoPropio,
  enviarMensajeCliente,
  obtenerUrlFirmadaCliente,
} from "@/app/cliente/solicitud/actions";

const PASOS: { estado: EstadoSolicitud; label: string }[] = [
  { estado: "nueva", label: "Recibida" },
  { estado: "en_revision", label: "En revisión" },
  { estado: "asignada", label: "Asignada" },
  { estado: "en_curso", label: "En curso" },
  { estado: "resuelta", label: "Resuelta" },
];

const ROL_LABEL: Record<Rol, string> = {
  admin: "Legal Nea",
  abogado: "Tu abogado",
  cliente: "Vos",
};

type Solicitud = {
  id: string;
  motivo_consulta: string;
  estado: EstadoSolicitud;
  created_at: string;
  abogadoNombre: string | null;
  adjuntos: { id: string; nombre: string; ruta: string }[];
  mensajes: { id: string; contenido: string; autorRol: Rol; createdAt: string }[];
  eventos: { id: string; etapa: string; nota: string | null; autorRol: Rol; createdAt: string }[];
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

export function SolicitudCliente({ solicitud }: { solicitud: Solicitud }) {
  const [mensaje, setMensaje] = React.useState("");
  const [enviandoMensaje, setEnviandoMensaje] = React.useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = React.useState(false);
  const inputArchivoRef = React.useRef<HTMLInputElement>(null);

  const esTerminalAlterno = solicitud.estado === "derivada" || solicitud.estado === "cerrada";
  const pasoActual = PASOS.findIndex((p) => p.estado === solicitud.estado);

  async function enviarMensaje() {
    if (!mensaje.trim()) return;
    setEnviandoMensaje(true);
    const res = await enviarMensajeCliente(solicitud.id, mensaje);
    setEnviandoMensaje(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setMensaje("");
    toast.success("Mensaje enviado.");
  }

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
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Solicitud del {formatearFecha(solicitud.created_at)}</CardTitle>
          {esTerminalAlterno && <Badge variant="outline">{solicitud.estado}</Badge>}
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

        <p className="text-sm">{solicitud.motivo_consulta}</p>

        <div className="flex items-center gap-2 text-sm">
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

        <div className="grid gap-2 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Mensajes</p>
          {solicitud.mensajes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todavía no hay mensajes.</p>
          ) : (
            <div className="grid gap-2">
              {solicitud.mensajes.map((m) => (
                <div key={m.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    {ROL_LABEL[m.autorRol]} · {formatearFecha(m.createdAt)}
                  </p>
                  {m.contenido}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribí un mensaje..."
              rows={2}
              className="flex-1"
            />
            <Button size="icon" onClick={enviarMensaje} disabled={enviandoMensaje} className="self-end">
              {enviandoMensaje ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
