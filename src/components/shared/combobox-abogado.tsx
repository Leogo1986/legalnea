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

export type AbogadoParaAsignar = {
  id: string;
  nombre_completo: string;
  provincia: string;
  casosAsignados: number;
};

// Buscador de abogados para asignar a una solicitud — hay muchos como para
// desplazarse en un <select> plano, así que es un combobox filtrable (mismo
// patrón que ComboboxProvincia) que además muestra cuántos casos tiene
// asignados cada uno.
export function ComboboxAbogado({
  abogados,
  value,
  onChange,
  placeholder = "Sin asignar",
}: {
  abogados: AbogadoParaAsignar[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const seleccionado = abogados.find((a) => a.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className={cn("truncate", !seleccionado && "text-muted-foreground")}>
          {seleccionado
            ? `${seleccionado.nombre_completo} — ${seleccionado.provincia} (${seleccionado.casosAsignados})`
            : placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre o provincia..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {abogados.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.nombre_completo} ${a.provincia}`}
                  onSelect={() => {
                    onChange(a.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value === a.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{a.nombre_completo}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.provincia} ({a.casosAsignados})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
