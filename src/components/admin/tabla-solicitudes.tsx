"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  Eye,
  KeyRound,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComboboxAbogado, type AbogadoParaAsignar } from "@/components/shared/combobox-abogado";
import { armarLinkWhatsapp, mensajeSolicitudAprobada } from "@/lib/whatsapp";
import type { EstadoSolicitud, Prioridad, Rol } from "@/types/database";
import {
  aprobarSolicitud,
  asignarAbogado,
  cambiarEstadoSolicitud,
  cambiarPrioridadSolicitud,
  enviarMensajeAdmin,
  generarClaveClienteExistente,
  obtenerUrlFirmadaAdjunto,
  rechazarSolicitud,
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
  "rechazada",
];
const PRIORIDADES: Prioridad[] = ["baja", "media", "alta", "urgente"];

const ESTILO_PRIORIDAD: Record<Prioridad, string> = {
  baja: "text-muted-foreground",
  media: "text-blue-600 border-blue-300",
  alta: "text-amber-600 border-amber-300",
  urgente: "text-destructive border-destructive/30",
};

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

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

export function TablaSolicitudes({
  solicitudes,
  abogadosAprobados,
  estadoFiltro,
  siteUrl,
}: {
  solicitudes: SolicitudAdmin[];
  abogadosAprobados: AbogadoParaAsignar[];
  estadoFiltro: EstadoSolicitud | null;
  siteUrl: string;
}) {
  const router = useRouter();
  // Se guarda el id, no una copia del objeto: `detalle` se deriva de
  // `solicitudes` en cada render, así que después de un router.refresh() (al
  // asignar abogado, cambiar estado/prioridad) el diálogo siempre muestra lo
  // último guardado — antes se guardaba una copia congelada al abrir el
  // ojito y quedaba desactualizada aunque el toast dijera "Listo".
  const [detalleId, setDetalleId] = React.useState<string | null>(null);
  const detalle = detalleId ? (solicitudes.find((s) => s.id === detalleId) ?? null) : null;

  const [mensaje, setMensaje] = React.useState("");
  const [enviandoMensaje, setEnviandoMensaje] = React.useState(false);
  const [enAccion, setEnAccion] = React.useState<string | null>(null);
  const [dialogoRechazo, setDialogoRechazo] = React.useState<SolicitudAdmin | null>(null);
  const [motivoRechazo, setMotivoRechazo] = React.useState("");
  // Solicitudes que el admin ya abrió con el ojito en esta sesión — se exige
  // haber mirado el detalle antes de poder aprobar (pedido explícito: no
  // aceptar a ciegas). Se resetea al recargar la página a propósito.
  const [vistos, setVistos] = React.useState<Set<string>>(new Set());

  function verDetalle(s: SolicitudAdmin) {
    setDetalleId(s.id);
    setVistos((prev) => new Set(prev).add(s.id));
  }
  // Separado de `ocupado` a propósito: `ocupado` lo usan los selects de
  // estado/prioridad/abogado del diálogo — si este botón comparte esa misma
  // bandera, cambiar la prioridad lo deja gris con el spinner puesto aunque
  // nunca se ejecutó (así se reportó el bug).
  const [reseteandoPassword, setReseteandoPassword] = React.useState(false);
  // Clave temporal recién generada (al aprobar o al pedirla a mano) — se
  // muestra una sola vez acá para copiarla o mandarla por WhatsApp; no queda
  // guardada en ningún lado en texto plano.
  const [claveGenerada, setClaveGenerada] = React.useState<{
    nombre: string;
    email: string;
    telefono: string;
    password: string;
  } | null>(null);

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
    const res = await fn();
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    toast.success("Listo.");
    router.refresh();
  }

  async function ejecutarFila(id: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setEnAccion(id);
    const res = await fn();
    setEnAccion(null);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    toast.success("Listo.");
    router.refresh();
  }

  async function aprobar(s: SolicitudAdmin) {
    setEnAccion(s.id);
    const res = await aprobarSolicitud(s.id);
    setEnAccion(null);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    toast.success("Solicitud aprobada.");
    if (res.password) {
      setClaveGenerada({
        nombre: s.cliente_nombre,
        email: s.cliente_email,
        telefono: s.cliente_telefono,
        password: res.password,
      });
    }
    router.refresh();
  }

  // Genera una clave nueva y abre el diálogo para copiarla/mandarla — se usa
  // tanto desde el botón de WhatsApp de la fila (cliente ya aprobado antes)
  // como desde "Generar nueva clave" en el detalle.
  async function generarYMostrarClave(
    idBusy: string,
    datos: { nombre: string; email: string; telefono: string }
  ) {
    setEnAccion(idBusy);
    const res = await generarClaveClienteExistente(datos.email);
    setEnAccion(null);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    if (res.password) {
      setClaveGenerada({ ...datos, password: res.password });
    }
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
              <TableHead className="text-right">Acciones</TableHead>
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
                  <Badge variant="outline" className={ESTILO_ESTADO[s.estado]}>
                    {s.estado.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={ESTILO_PRIORIDAD[s.prioridad]}>
                    {s.prioridad}
                  </Badge>
                </TableCell>
                <TableCell>{s.abogado_asignado_nombre ?? "—"}</TableCell>
                <TableCell>{formatearFecha(s.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {enAccion === s.id ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {s.estado === "nueva" && (
                          <>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              title={
                                vistos.has(s.id)
                                  ? "Aprobar"
                                  : "Mirá el detalle primero (ícono del ojo)"
                              }
                              disabled={!vistos.has(s.id)}
                              onClick={() => aprobar(s)}
                            >
                              <Check className="size-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              title="Rechazar"
                              onClick={() => {
                                setMotivoRechazo("");
                                setDialogoRechazo(s);
                              }}
                            >
                              <X className="size-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {s.estado !== "nueva" && s.estado !== "rechazada" && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Generar clave y avisar por WhatsApp"
                            onClick={() =>
                              generarYMostrarClave(s.id, {
                                nombre: s.cliente_nombre,
                                email: s.cliente_email,
                                telefono: s.cliente_telefono,
                              })
                            }
                          >
                            <MessageCircle className="size-4 text-emerald-600" />
                          </Button>
                        )}
                        <Button size="icon-sm" variant="ghost" title="Ver detalle" onClick={() => verDetalle(s)}>
                          <Eye className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalleId(null)}>
        <DialogContent className="max-w-lg">
          {detalle && (
            <>
              <DialogHeader>
                <DialogTitle>{detalle.cliente_nombre}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
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
                  <ComboboxAbogado
                    abogados={abogadosAprobados}
                    value={detalle.abogado_asignado_id}
                    onChange={(id) => conFeedback(() => asignarAbogado(detalle.id, id))}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={async () => {
                    setReseteandoPassword(true);
                    await generarYMostrarClave(`detalle-${detalle.id}`, {
                      nombre: detalle.cliente_nombre,
                      email: detalle.cliente_email,
                      telefono: detalle.cliente_telefono,
                    });
                    setReseteandoPassword(false);
                  }}
                  disabled={reseteandoPassword}
                >
                  {reseteandoPassword ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <KeyRound className="size-3.5" />
                  )}
                  Generar nueva clave
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

      <Dialog open={!!dialogoRechazo} onOpenChange={(open) => !open && setDialogoRechazo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud de {dialogoRechazo?.cliente_nombre}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="motivo-rechazo">Motivo (opcional, queda registrado)</Label>
            <Textarea
              id="motivo-rechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!dialogoRechazo) return;
                const id = dialogoRechazo.id;
                setDialogoRechazo(null);
                await ejecutarFila(id, () => rechazarSolicitud(id, motivoRechazo));
              }}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!claveGenerada} onOpenChange={(open) => !open && setClaveGenerada(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clave para {claveGenerada?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <p className="text-muted-foreground">
              Se muestra una sola vez acá — copiala o mandala por WhatsApp ahora. No queda
              guardada en ningún lado en texto plano.
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <span className="flex-1 truncate font-mono text-base">{claveGenerada?.password}</span>
              <Button
                size="icon-sm"
                variant="ghost"
                title="Copiar clave"
                onClick={() => {
                  if (!claveGenerada) return;
                  navigator.clipboard.writeText(claveGenerada.password);
                  toast.success("Clave copiada.");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!claveGenerada) return;
                const mensaje = mensajeSolicitudAprobada(
                  claveGenerada.nombre,
                  claveGenerada.email,
                  claveGenerada.password,
                  siteUrl
                );
                window.open(armarLinkWhatsapp(claveGenerada.telefono, mensaje), "_blank", "noopener,noreferrer");
                setClaveGenerada(null);
              }}
            >
              <MessageCircle className="size-4" />
              Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
