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
import { PROVINCIAS_ARGENTINA } from "@/lib/data/provincias";

// Combobox "editable": permite elegir una provincia de la lista o escribir
// un valor libre (para casos de exterior/otras jurisdicciones).
export function ComboboxProvincia({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value || "Seleccioná tu provincia"}
        </span>
        <ChevronsUpDown className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar provincia..."
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
              {PROVINCIAS_ARGENTINA.map((provincia) => (
                <CommandItem
                  key={provincia}
                  value={provincia}
                  onSelect={() => {
                    onChange(provincia);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === provincia ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {provincia}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
