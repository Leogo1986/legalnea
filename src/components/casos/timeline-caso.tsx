"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Rol } from "@/types/database";

// Sugerencias de etapas de un trámite jurídico genérico (civil/laboral/penal
// o extrajudicial) — la columna en DB es texto libre, esto es solo para no
// obligar al abogado a escribir siempre desde cero.
const ETAPAS_SUGERIDAS = [
  "Consulta recibida / caso iniciado",
  "En análisis — armando estrategia",
  "Gestión extrajudicial (carta documento, negociación, mediación previa)",
  "Escrito o demanda presentada",
  "En trámite ante el juzgado",
  "Audiencia fijada",
  "Audiencia realizada",
  "Sentencia o resolución dictada",
  "Caso resuelto",
  "Caso archivado / cerrado sin resolución",
];

const OTRA = "__otra__";

const ROL_LABEL: Record<Rol, string> = {
  admin: "Legal Nea",
  abogado: "Abogado",
  cliente: "Cliente",
};

type Evento = {
  id: string;
  etapa: string;
  nota: string | null;
  autorRol: Rol;
  createdAt: string;
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

export function TimelineCaso({
  eventos,
  soloLectura = true,
  onAgregar,
}: {
  eventos: Evento[];
  soloLectura?: boolean;
  onAgregar?: (etapa: string, nota: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [etapaSeleccionada, setEtapaSeleccionada] = React.useState("");
  const [etapaLibre, setEtapaLibre] = React.useState("");
  const [nota, setNota] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);

  const esOtra = etapaSeleccionada === OTRA;

  async function agregar() {
    if (!onAgregar) return;
    const etapa = esOtra ? etapaLibre : etapaSeleccionada;
    if (!etapa.trim()) {
      toast.error("Elegí o escribí una etapa.");
      return;
    }
    setGuardando(true);
    const res = await onAgregar(etapa, nota);
    setGuardando(false);
    if (!res.success) {
      toast.error(res.error ?? "No pudimos guardar la etapa.");
      return;
    }
    toast.success("Etapa agregada.");
    setEtapaSeleccionada("");
    setEtapaLibre("");
    setNota("");
  }

  return (
    <div className="grid gap-4">
      {!soloLectura && onAgregar && (
        <div className="grid gap-2 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Agregar etapa al trámite</p>
          <Select
            value={etapaSeleccionada}
            onValueChange={(v) => setEtapaSeleccionada(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí una etapa..." />
            </SelectTrigger>
            <SelectContent>
              {ETAPAS_SUGERIDAS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
              <SelectItem value={OTRA}>Otra (escribir)...</SelectItem>
            </SelectContent>
          </Select>
          {esOtra && (
            <Input
              value={etapaLibre}
              onChange={(e) => setEtapaLibre(e.target.value)}
              placeholder="Describí la etapa"
            />
          )}
          <Textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota opcional..."
            rows={2}
          />
          <Button size="sm" onClick={agregar} disabled={guardando} className="w-fit">
            {guardando ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Agregar etapa
          </Button>
        </div>
      )}

      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay etapas cargadas.</p>
      ) : (
        <ol className="grid gap-0">
          {eventos.map((ev, i) => (
            <li key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                {i < eventos.length - 1 && (
                  <Separator orientation="vertical" className="my-1 min-h-8 flex-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium">{ev.etapa}</p>
                {ev.nota && <p className="text-sm text-muted-foreground">{ev.nota}</p>}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ROL_LABEL[ev.autorRol]} · {formatearFecha(ev.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
