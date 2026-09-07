"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, KeyRound, Loader2, Search, UserX, X } from "lucide-react";
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
import type { EstadoAbogado } from "@/types/database";
import {
  aprobarAbogado,
  rechazarAbogado,
  reactivarAbogado,
  resetearPasswordAbogado,
  suspenderAbogado,
} from "@/app/admin/abogados/actions";

export type AbogadoAdmin = {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  provincia: string;
  localidad: string;
  estado: EstadoAbogado;
  fecha_alta: string;
  motivo_rechazo: string | null;
  especialidades: string[];
};

const ESTILO_ESTADO: Record<EstadoAbogado, string> = {
  pendiente: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  aprobado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rechazado: "bg-destructive/15 text-destructive",
  inactivo: "bg-muted text-muted-foreground",
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(fecha));
}

export function TablaAbogados({
  abogados,
  estadoFiltro,
}: {
  abogados: AbogadoAdmin[];
  estadoFiltro: EstadoAbogado | null;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = React.useState("");
  const [enAccion, setEnAccion] = React.useState<string | null>(null);
  const [dialogoRechazo, setDialogoRechazo] = React.useState<AbogadoAdmin | null>(null);
  const [motivo, setMotivo] = React.useState("");

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
                      {cargando ? (
                        <Loader2 className="mx-2 size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {a.estado === "pendiente" && (
                            <>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Aprobar"
                                onClick={() => ejecutar(a.id, () => aprobarAbogado(a.id))}
                              >
                                <Check className="size-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Rechazar"
                                onClick={() => {
                                  setMotivo("");
                                  setDialogoRechazo(a);
                                }}
                              >
                                <X className="size-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {a.estado === "aprobado" && (
                            <>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Restablecer contraseña"
                                onClick={() => ejecutar(a.id, () => resetearPasswordAbogado(a.email))}
                              >
                                <KeyRound className="size-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Suspender"
                                onClick={() => ejecutar(a.id, () => suspenderAbogado(a.id))}
                              >
                                <UserX className="size-4 text-amber-600" />
                              </Button>
                            </>
                          )}
                          {a.estado === "inactivo" && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              title="Reactivar"
                              onClick={() => ejecutar(a.id, () => reactivarAbogado(a.id))}
                            >
                              <Check className="size-4 text-emerald-600" />
                            </Button>
                          )}
                        </>
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
    </div>
  );
}
