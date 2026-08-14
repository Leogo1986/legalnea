"use client";

import * as React from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SugerenciaDireccion } from "@/app/api/geocode/route";

// Autocompletado de domicilio vía Nominatim/OpenStreetMap. Si el usuario
// elige una sugerencia, intenta rellenar provincia/localidad/CP; esos campos
// quedan editables igual (Nominatim puede no traer todo con confianza).
export function DomicilioAutocomplete({
  value,
  onChange,
  onSugerenciaSeleccionada,
  id,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSugerenciaSeleccionada: (sugerencia: SugerenciaDireccion) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [sugerencias, setSugerencias] = React.useState<SugerenciaDireccion[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [abierto, setAbierto] = React.useState(false);
  const contenedorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value.trim().length < 3) {
      setSugerencias([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSugerencias(data.sugerencias ?? []);
        setAbierto(true);
      } catch {
        // silencioso: no bloquea el formulario si Nominatim falla
      } finally {
        setCargando(false);
      }
    }, 450);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  React.useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  return (
    <div ref={contenedorRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => sugerencias.length > 0 && setAbierto(true)}
        />
        {cargando && (
          <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {abierto && sugerencias.length > 0 && (
        <div
          className={cn(
            "absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
          )}
        >
          {sugerencias.map((s, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onChange(s.displayName);
                onSugerenciaSeleccionada(s);
                setAbierto(false);
              }}
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{s.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
