"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Rol } from "@/types/database";

const ROL_LABEL: Record<Rol, string> = {
  admin: "Legal Nea",
  abogado: "Abogado",
  cliente: "Cliente",
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(fecha)
  );
}

type MensajeItem = { id: string; contenido: string; autorRol: Rol; createdAt: string };

// Chat por caso, compartido entre paneles. Extraído del chat inline que ya
// tenía `tabla-solicitudes.tsx` (admin↔cliente) para reusarlo del lado
// abogado sin duplicar el patrón mensaje-por-mensaje.
export function ChatCaso({
  mensajes,
  onEnviar,
  onAbrir,
}: {
  mensajes: MensajeItem[];
  onEnviar: (contenido: string) => Promise<{ success: boolean; error?: string }>;
  onAbrir?: () => void;
}) {
  const [mensaje, setMensaje] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const abrioRef = React.useRef(false);

  React.useEffect(() => {
    if (abrioRef.current) return;
    abrioRef.current = true;
    onAbrir?.();
  }, [onAbrir]);

  async function enviar() {
    if (!mensaje.trim()) return;
    setEnviando(true);
    const res = await onEnviar(mensaje);
    setEnviando(false);
    if (!res.success) {
      toast.error(res.error ?? "No pudimos enviar el mensaje.");
      return;
    }
    setMensaje("");
    toast.success("Mensaje enviado.");
  }

  return (
    <div className="grid gap-2 rounded-lg border p-3">
      {mensajes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavía no hay mensajes.</p>
      ) : (
        <div className="grid gap-2">
          {mensajes.map((m) => (
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
          placeholder="Escribí un mensaje al administrador..."
          rows={2}
          className="flex-1"
        />
        <Button size="icon" onClick={enviar} disabled={enviando} className="self-end">
          {enviando ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
