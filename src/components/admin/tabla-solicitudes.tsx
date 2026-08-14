"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Eye, KeyRound, Loader2, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EstadoSolicitud, Prioridad, Rol } from "@/types/database";
import {
  asignarAbogado,
  cambiarEstadoSolicitud,
  cambiarPrioridadSolicitud,
  enviarMensajeAdmin,
  obtenerUrlFirmadaAdjunto,
  resetearPasswordCliente,
} from "@/app/admin/solicitudes/actions";

export type SolicitudAdmin = {
  id: string;
  motivo_consulta: string;
  estado: EstadoSolicitud;
  prioridad: Prioridad;
  created_at: string;
  abogado_asignado_id: string | null;
  abogado_asignado_nombre: string | null;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  cliente_provincia: string;
  adjuntos: { id: string; nombre: string; ruta: string }[];
  mensajes: { id: string; contenido: string; autorRol: Rol; createdAt: string }[];
};

const ROL_LABEL: Record<Rol, string> = {
  admin: "Legal Nea",
  abogado: "Abogado",
  cliente: "Cliente",
};

const ESTADOS: EstadoSolicitud[] = [
  "nueva",
  "en_revision",
  "asignada",
  "en_curso",
  "resuelta",
  "derivada",
  "cerrada",
];
const PRIORIDADES: Prioridad[] = ["baja", "media", "alta", "urgente"];

const ESTILO_PRIORIDAD: Record<Prioridad, string> = {
  baja: "text-muted-foreground",
  media: "text-blue-600 border-blue-300",
  alta: "text-amber-600 border-amber-300",
  urgente: "text-destructive border-destructive/30",
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

export function TablaSolicitudes({
  solicitudes,
  abogadosAprobados,
  estadoFiltro,
}: {
  solicitudes: SolicitudAdmin[];
  abogadosAprobados: { id: string; nombre_completo: string; provincia: string }[];
  estadoFiltro: EstadoSolicitud | null;
}) {
  const router = useRouter();
  const [detalle, setDetalle] = React.useState<SolicitudAdmin | null>(null);
  const [ocupado, setOcupado] = React.useState(false);
  const [mensaje, setMensaje] = React.useState("");
  const [enviandoMensaje, setEnviandoMensaje] = React.useState(false);

  async function enviarMensaje() {
    if (!detalle || !mensaje.trim()) return;
    setEnviandoMensaje(true);
    const res = await enviarMensajeAdmin(detalle.id, mensaje);
    setEnviandoMensaje(false);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    setMensaje("");
    toast.success("Mensaje enviado.");
    router.refresh();
  }

  async function conFeedback(fn: () => Promise<{ success: boolean; error?: string }>) {
    setOcupado(true);
    const res = await fn();
    setOcupado(false);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    toast.success("Listo.");
    router.refresh();
  }

  async function descargarAdjunto(ruta: string) {
    const { url } = await obtenerUrlFirmadaAdjunto(ruta);
    if (!url) {
      toast.error("No pudimos generar el link de descarga.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-4">
      <Tabs value={estadoFiltro ?? "todos"}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="todos" render={<Link href="/admin/solicitudes" />}>
            Todas
          </TabsTrigger>
          {ESTADOS.map((e) => (
            <TabsTrigger key={e} value={e} render={<Link href={`/admin/solicitudes?estado=${e}`} />}>
              {e.replace("_", " ")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Abogado asignado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay solicitudes para mostrar.
                </TableCell>
              </TableRow>
            )}
            {solicitudes.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.cliente_nombre}</div>
                  <div className="text-xs text-muted-foreground">{s.cliente_email}</div>
                </TableCell>
                <TableCell>{s.cliente_provincia}</TableCell>
                <TableCell>
                  <Badge variant="outline">{s.estado.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={ESTILO_PRIORIDAD[s.prioridad]}>
                    {s.prioridad}
                  </Badge>
                </TableCell>
                <TableCell>{s.abogado_asignado_nombre ?? "—"}</TableCell>
                <TableCell>{formatearFecha(s.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon-sm" variant="ghost" onClick={() => setDetalle(s)}>
                    <Eye className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent className="max-w-lg">
          {detalle && (
            <>
              <DialogHeader>
                <DialogTitle>{detalle.cliente_nombre}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{detalle.cliente_email}</span>
                  <span>{detalle.cliente_telefono}</span>
                  <span>{detalle.cliente_provincia}</span>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">{detalle.motivo_consulta}</div>

                {detalle.adjuntos.length > 0 && (
                  <div className="grid gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Adjuntos</p>
                    {detalle.adjuntos.map((adj) => (
                      <Button
                        key={adj.id}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => descargarAdjunto(adj.ruta)}
                      >
                        <Download className="size-3.5" />
                        {adj.nombre}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Estado</p>
                    <Select
                      value={detalle.estado}
                      onValueChange={(v) =>
                        conFeedback(() => cambiarEstadoSolicitud(detalle.id, v as EstadoSolicitud))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Prioridad</p>
                    <Select
                      value={detalle.prioridad}
                      onValueChange={(v) =>
                        conFeedback(() => cambiarPrioridadSolicitud(detalle.id, v as Prioridad))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORIDADES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Asignar abogado</p>
                  <Select
                    value={detalle.abogado_asignado_id ?? undefined}
                    onValueChange={(v) => v && conFeedback(() => asignarAbogado(detalle.id, v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {abogadosAprobados.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nombre_completo} — {a.provincia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => conFeedback(() => resetearPasswordCliente(detalle.cliente_email))}
                  disabled={ocupado}
                >
                  {ocupado ? <Loader2 className="animate-spin" /> : <KeyRound className="size-3.5" />}
                  Restablecer contraseña del cliente
                </Button>

                <div className="grid gap-2 rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Mensajes</p>
                  {detalle.mensajes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Todavía no hay mensajes.</p>
                  ) : (
                    <div className="grid max-h-40 gap-2 overflow-y-auto">
                      {detalle.mensajes.map((m) => (
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
                      placeholder="Escribirle al cliente y/o abogado asignado..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={enviarMensaje}
                      disabled={enviandoMensaje}
                      className="self-end"
                    >
                      {enviandoMensaje ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
