"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Download, Eye, Loader2, MessageCircle, Search, UserX, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { iniciales } from "@/lib/estilos-estado";
import { armarLinkWhatsapp, mensajeAltaAbogadoAprobada } from "@/lib/whatsapp";
import type { EstadoAbogado } from "@/types/database";
import {
  aprobarAbogado,
  generarClaveAbogadoExistente,
  obtenerUrlFirmadaDj,
  rechazarAbogado,
  reactivarAbogado,
  suspenderAbogado,
} from "@/app/admin/abogados/actions";

export type AbogadoAdmin = {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  dni: string | null;
  provincia: string;
  localidad: string;
  calle: string | null;
  altura: string | null;
  piso: string | null;
  dpto: string | null;
  codigo_postal: string | null;
  matricula_federal: string | null;
  matricula_provincial: string | null;
  anios_experiencia: number | null;
  motivacion: string | null;
  declaracion_jurada_pdf_url: string | null;
  estado: EstadoAbogado;
  fecha_alta: string;
  motivo_rechazo: string | null;
  especialidades: string[];
};

function domicilioCompleto(a: AbogadoAdmin) {
  const partes = [a.calle, a.altura].filter(Boolean).join(" ");
  const pisoDpto = [a.piso && `piso ${a.piso}`, a.dpto && `dpto ${a.dpto}`].filter(Boolean).join(", ");
  return [partes, pisoDpto, a.localidad, a.provincia].filter(Boolean).join(", ") || "—";
}

const ESTILO_ESTADO: Record<EstadoAbogado, string> = {
  pendiente: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  aprobado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rechazado: "bg-destructive/15 text-destructive",
  inactivo: "bg-muted text-muted-foreground",
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(fecha));
}

// Mismo set de botones en la fila (compacto, solo ícono) y en el diálogo de
// detalle (expandido, con label) — factorizado como componente propio (no
// definido dentro del render de TablaAbogados: el linter lo marca como
// error, "Cannot create components during render", porque perdería estado
// entre renders si se recreara así).
function AccionesAbogado({
  a,
  ocupado,
  expandido = false,
  onAprobar,
  onRechazar,
  onGenerarClave,
  onSuspender,
  onReactivar,
}: {
  a: AbogadoAdmin;
  ocupado: boolean;
  expandido?: boolean;
  onAprobar: (a: AbogadoAdmin) => void;
  onRechazar: (a: AbogadoAdmin) => void;
  onGenerarClave: (a: AbogadoAdmin) => void;
  onSuspender: (a: AbogadoAdmin) => void;
  onReactivar: (a: AbogadoAdmin) => void;
}) {
  if (ocupado) return <Loader2 className="mx-2 size-4 animate-spin text-muted-foreground" />;

  const size = expandido ? "sm" : "icon-sm";
  const variant = expandido ? "outline" : "ghost";

  if (a.estado === "pendiente") {
    return (
      <>
        <Button size={size} variant={variant} title="Aprobar" onClick={() => onAprobar(a)}>
          <Check className="size-4 text-emerald-600" />
          {expandido && "Aprobar"}
        </Button>
        <Button size={size} variant={variant} title="Rechazar" onClick={() => onRechazar(a)}>
          <X className="size-4 text-destructive" />
          {expandido && "Rechazar"}
        </Button>
      </>
    );
  }

  if (a.estado === "aprobado") {
    return (
      <>
        <Button size={size} variant={variant} title="Generar clave y avisar por WhatsApp" onClick={() => onGenerarClave(a)}>
          <MessageCircle className="size-4 text-emerald-600" />
          {expandido && "Generar clave y avisar por WhatsApp"}
        </Button>
        <Button size={size} variant={variant} title="Suspender" onClick={() => onSuspender(a)}>
          <UserX className="size-4 text-amber-600" />
          {expandido && "Suspender"}
        </Button>
      </>
    );
  }

  if (a.estado === "inactivo") {
    return (
      <Button size={size} variant={variant} title="Reactivar" onClick={() => onReactivar(a)}>
        <Check className="size-4 text-emerald-600" />
        {expandido && "Reactivar"}
      </Button>
    );
  }

  return null;
}

export function TablaAbogados({
  abogados,
  estadoFiltro,
  siteUrl,
}: {
  abogados: AbogadoAdmin[];
  estadoFiltro: EstadoAbogado | null;
  siteUrl: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = React.useState("");
  const [enAccion, setEnAccion] = React.useState<string | null>(null);
  const [dialogoRechazo, setDialogoRechazo] = React.useState<AbogadoAdmin | null>(null);
  const [motivo, setMotivo] = React.useState("");
  // Igual que en tabla-solicitudes.tsx: se guarda el id, no una copia — así
  // el detalle siempre muestra el dato actualizado después de un
  // router.refresh() (aprobar/rechazar desde el propio diálogo).
  const [detalleId, setDetalleId] = React.useState<string | null>(null);
  const detalle = detalleId ? (abogados.find((a) => a.id === detalleId) ?? null) : null;
  // Clave recién generada (al aprobar o a mano) — se muestra una sola vez
  // para copiarla o mandarla por WhatsApp, mismo mecanismo que en
  // tabla-solicitudes.tsx.
  const [claveGenerada, setClaveGenerada] = React.useState<{
    nombre: string;
    email: string;
    telefono: string;
    password: string;
  } | null>(null);

  const filtrados = abogados.filter((a) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      a.nombre_completo.toLowerCase().includes(q) ||
      a.provincia.toLowerCase().includes(q) ||
      a.especialidades.some((e) => e.toLowerCase().includes(q))
    );
  });

  async function ejecutar(id: string, fn: () => Promise<{ success: boolean; error?: string }>) {
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

  async function aprobar(a: AbogadoAdmin) {
    setEnAccion(a.id);
    const res = await aprobarAbogado(a.id);
    setEnAccion(null);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    toast.success("Abogado aprobado.");
    if (res.password) {
      setClaveGenerada({ nombre: a.nombre_completo, email: a.email, telefono: a.telefono, password: res.password });
    }
    router.refresh();
  }

  // Genera una clave nueva y abre el diálogo para copiarla/mandarla — se usa
  // desde el botón de WhatsApp de la fila/detalle para un abogado que ya
  // estaba aprobado antes (ej. perdió la clave).
  async function generarYMostrarClave(idBusy: string, a: AbogadoAdmin) {
    setEnAccion(idBusy);
    const res = await generarClaveAbogadoExistente(a.email);
    setEnAccion(null);
    if (!res.success) {
      toast.error(res.error ?? "Ocurrió un error.");
      return;
    }
    if (res.password) {
      setClaveGenerada({ nombre: a.nombre_completo, email: a.email, telefono: a.telefono, password: res.password });
    }
  }

  async function descargarDj(ruta: string) {
    const { url } = await obtenerUrlFirmadaDj(ruta);
    if (!url) {
      toast.error("No pudimos generar el link de descarga.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function alRechazar(a: AbogadoAdmin) {
    setMotivo("");
    setDialogoRechazo(a);
    setDetalleId(null);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={estadoFiltro ?? "todos"}>
          <TabsList>
            <TabsTrigger value="todos" render={<Link href="/admin/abogados" />}>
              Todos
            </TabsTrigger>
            <TabsTrigger value="pendiente" render={<Link href="/admin/abogados?estado=pendiente" />}>
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="aprobado" render={<Link href="/admin/abogados?estado=aprobado" />}>
              Aprobados
            </TabsTrigger>
            <TabsTrigger value="rechazado" render={<Link href="/admin/abogados?estado=rechazado" />}>
              Rechazados
            </TabsTrigger>
            <TabsTrigger value="inactivo" render={<Link href="/admin/abogados?estado=inactivo" />}>
              Inactivos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, provincia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No hay abogados para mostrar.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((a) => {
              const cargando = enAccion === a.id;
              return (
                <TableRow key={a.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" className="shrink-0">
                        <AvatarFallback>{iniciales(a.nombre_completo)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.nombre_completo}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {a.provincia}
                    <div className="text-xs text-muted-foreground">{a.localidad}</div>
                  </TableCell>
                  <TableCell className="max-w-56 whitespace-normal py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.especialidades.slice(0, 3).map((e) => (
                        <Badge key={e} variant="secondary" className="text-[0.65rem]">
                          {e}
                        </Badge>
                      ))}
                      {a.especialidades.length > 3 && (
                        <Badge variant="outline" className="text-[0.65rem]">
                          +{a.especialidades.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={ESTILO_ESTADO[a.estado]}>{a.estado}</Badge>
                    {a.estado === "rechazado" && a.motivo_rechazo && (
                      <p className="mt-1 max-w-40 truncate text-xs text-muted-foreground" title={a.motivo_rechazo}>
                        {a.motivo_rechazo}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground">{formatearFecha(a.fecha_alta)}</TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="inline-flex items-center gap-0.5 rounded-lg border p-1">
                      <AccionesAbogado
                        a={a}
                        ocupado={cargando}
                        onAprobar={aprobar}
                        onRechazar={alRechazar}
                        onGenerarClave={(a) => generarYMostrarClave(a.id, a)}
                        onSuspender={(a) => ejecutar(a.id, () => suspenderAbogado(a.id))}
                        onReactivar={(a) => ejecutar(a.id, () => reactivarAbogado(a.id))}
                      />
                      {!cargando && (
                        <Button size="icon-sm" variant="ghost" title="Ver datos" onClick={() => setDetalleId(a.id)}>
                          <Eye className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!dialogoRechazo} onOpenChange={(open) => !open && setDialogoRechazo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar a {dialogoRechazo?.nombre_completo}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="motivo">Motivo (opcional, se le envía por email)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
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
                await ejecutar(id, () => rechazarAbogado(id, motivo));
              }}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalleId(null)}>
        <DialogContent className="max-w-lg">
          {detalle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{iniciales(detalle.nombre_completo)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{detalle.nombre_completo}</DialogTitle>
                    <Badge className={ESTILO_ESTADO[detalle.estado]}>{detalle.estado}</Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <span>{detalle.email}</span>
                  <span>{detalle.telefono}</span>
                  <span>DNI: {detalle.dni ?? "—"}</span>
                  <span>Alta: {formatearFecha(detalle.fecha_alta)}</span>
                </div>

                <div className="grid gap-1">
                  <p className="text-xs font-medium text-muted-foreground">Domicilio</p>
                  <p className="rounded-lg border bg-muted/30 p-3">{domicilioCompleto(detalle)}</p>
                  {detalle.codigo_postal && (
                    <p className="text-xs text-muted-foreground">CP {detalle.codigo_postal}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Matrícula federal</p>
                    <p>{detalle.matricula_federal ?? "—"}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Matrícula provincial</p>
                    <p>{detalle.matricula_provincial ?? "—"}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Años de experiencia</p>
                    <p>{detalle.anios_experiencia ?? "—"}</p>
                  </div>
                </div>

                {detalle.especialidades.length > 0 && (
                  <div className="grid gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Especialidades</p>
                    <div className="flex flex-wrap gap-1">
                      {detalle.especialidades.map((e) => (
                        <Badge key={e} variant="secondary">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detalle.motivacion && (
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Motivación</p>
                    <p className="rounded-lg border bg-muted/30 p-3">{detalle.motivacion}</p>
                  </div>
                )}

                {detalle.declaracion_jurada_pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => descargarDj(detalle.declaracion_jurada_pdf_url!)}
                  >
                    <Download className="size-3.5" />
                    Declaración jurada (PDF)
                  </Button>
                )}

                {detalle.estado === "rechazado" && detalle.motivo_rechazo && (
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Motivo de rechazo</p>
                    <p className="rounded-lg border bg-destructive/10 p-3 text-destructive">
                      {detalle.motivo_rechazo}
                    </p>
                  </div>
                )}
              </div>

              {detalle.estado !== "rechazado" && (
                <DialogFooter>
                  <AccionesAbogado
                    a={detalle}
                    ocupado={enAccion === detalle.id}
                    expandido
                    onAprobar={aprobar}
                    onRechazar={alRechazar}
                    onGenerarClave={(a) => generarYMostrarClave(`detalle-${a.id}`, a)}
                    onSuspender={(a) => ejecutar(a.id, () => suspenderAbogado(a.id))}
                    onReactivar={(a) => ejecutar(a.id, () => reactivarAbogado(a.id))}
                  />
                </DialogFooter>
              )}
            </>
          )}
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
                const mensaje = mensajeAltaAbogadoAprobada(
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
