"use client";

import * as React from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_ARCHIVOS_SOLICITUD,
  MAX_TAMANIO_ARCHIVO_BYTES,
  validarArchivoAdjunto,
} from "@/lib/validation/cliente.schema";

function formatearTamanio(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  archivos,
  onChange,
}: {
  archivos: File[];
  onChange: (archivos: File[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  function agregarArchivos(nuevos: FileList | null) {
    if (!nuevos) return;
    setError(null);
    const candidatos = Array.from(nuevos);
    const siguientes = [...archivos];

    for (const archivo of candidatos) {
      if (siguientes.length >= MAX_ARCHIVOS_SOLICITUD) {
        setError(`Máximo ${MAX_ARCHIVOS_SOLICITUD} archivos.`);
        break;
      }
      const errorArchivo = validarArchivoAdjunto(archivo);
      if (errorArchivo) {
        setError(errorArchivo);
        continue;
      }
      siguientes.push(archivo);
    }

    onChange(siguientes);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2">
      <div
        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed p-5 text-center hover:bg-muted/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          agregarArchivos(e.dataTransfer.files);
        }}
      >
        <Paperclip className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arrastrá archivos o hacé click para elegirlos
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOC, DOCX, JPG o PNG · máx. {MAX_ARCHIVOS_SOLICITUD} archivos ·{" "}
          {Math.round(MAX_TAMANIO_ARCHIVO_BYTES / (1024 * 1024))}MB c/u
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => agregarArchivos(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {archivos.length > 0 && (
        <ul className="grid gap-1.5">
          {archivos.map((archivo, i) => (
            <li
              key={`${archivo.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{archivo.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatearTamanio(archivo.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(archivos.filter((_, idx) => idx !== i))}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
