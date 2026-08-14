"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CONTENIDO_DECLARACION_JURADA,
  TITULO_DECLARACION_JURADA,
} from "@/lib/legal/declaracion-jurada";

export type DatosParaDeclaracion = {
  nombreCompleto: string;
  email: string;
  provincia: string;
  matriculaFederal?: string;
  matriculaProvincial?: string;
};

export function DeclaracionJuradaModal({
  open,
  onOpenChange,
  datos,
  enviando,
  onAceptar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datos: DatosParaDeclaracion;
  enviando: boolean;
  onAceptar: () => void;
}) {
  const [aceptado, setAceptado] = React.useState(false);
  const [descargando, setDescargando] = React.useState(false);

  // El checkbox arranca destildado cada vez que se abre el modal.
  React.useEffect(() => {
    if (open) setAceptado(false);
  }, [open]);

  async function descargarPdf() {
    setDescargando(true);
    try {
      const res = await fetch("/api/declaracion-jurada-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("No pudimos generar el PDF. Probá de nuevo en un momento.");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{TITULO_DECLARACION_JURADA}</DialogTitle>
          <DialogDescription>
            Leé el texto completo antes de aceptar. Podés descargarlo en PDF
            para conservarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto rounded-lg border bg-muted/20 p-4 font-serif text-[0.9rem] leading-relaxed">
          {CONTENIDO_DECLARACION_JURADA.map((bloque, i) => {
            if (bloque.tipo === "considerando") {
              return (
                <p key={i} className="mt-4 mb-2 font-bold first:mt-0">
                  {bloque.texto}
                </p>
              );
            }
            if (bloque.tipo === "item") {
              return (
                <p key={i} className="mb-3">
                  <span className="font-bold">{bloque.numero}. </span>
                  {bloque.texto}
                </p>
              );
            }
            return (
              <p key={i} className="mb-3">
                {bloque.texto}
              </p>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={descargarPdf}
          disabled={descargando}
          className="w-fit"
        >
          {descargando ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          Descargar en PDF
        </Button>

        <div className="flex items-start gap-2 rounded-lg border bg-background p-3">
          <Checkbox
            id="acepto-dj"
            checked={aceptado}
            onCheckedChange={(checked) => setAceptado(checked === true)}
          />
          <Label htmlFor="acepto-dj" className="font-normal">
            He leído y acepto los términos de la Declaración de Trabajo Pro
            Bono.
          </Label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!aceptado || enviando}
            onClick={onAceptar}
          >
            {enviando && <Loader2 className="animate-spin" />}
            Aceptar y enviar mi solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
