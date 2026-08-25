"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCALIDADES_POR_PROVINCIA } from "@/lib/data/localidades.generated";
import type { Provincia } from "@/lib/data/provincias";

// Combobox buscable de localidades, dependiente de la provincia elegida
// (dataset oficial completo, ver scripts/generar-localidades.mjs). Igual que
// ComboboxProvincia, permite usar texto libre si no aparece en la lista.
export function SelectLocalidad({
  provincia,
  value,
  onChange,
  disabled,
  id,
}: {
  provincia: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState("");

  const localidades = LOCALIDADES_POR_PROVINCIA[provincia as Provincia] ?? [];
  const habilitado = !disabled && localidades.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={!habilitado}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || (provincia ? "Seleccioná tu localidad" : "Elegí primero la provincia")}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar localidad..."
            value={busqueda}
            onValueChange={setBusqueda}
          />
          <CommandList>
            <CommandEmpty>
              {busqueda ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm hover:underline"
                  onClick={() => {
                    onChange(busqueda.trim());
                    setOpen(false);
                  }}
                >
                  Usar &quot;{busqueda.trim()}&quot;
                </button>
              ) : (
                "Sin resultados."
              )}
            </CommandEmpty>
            <CommandGroup>
              {localidades.map((localidad) => (
                <CommandItem
                  key={localidad}
                  value={localidad}
                  onSelect={() => {
                    onChange(localidad);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === localidad ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {localidad}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
