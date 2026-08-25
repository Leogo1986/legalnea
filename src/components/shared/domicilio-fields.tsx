"use client";

import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Reemplaza al viejo autocompletado de Nominatim: acá se carga a mano,
// partido en Calle/Altura (obligatorios) + Piso/Dpto (opcionales). Requiere
// que el schema del formulario que lo use tenga los campos
// calle/altura/piso/dpto con esos nombres exactos.
export function DomicilioFields<T extends FieldValues>({
  register,
  errors,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  const errorCalle = errors.calle?.message as string | undefined;
  const errorAltura = errors.altura?.message as string | undefined;

  return (
    <div className="grid gap-1.5">
      <Label>Domicilio</Label>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="grid gap-1">
          <Label htmlFor="calle" className="text-xs font-normal text-muted-foreground">
            Calle
          </Label>
          <Input id="calle" aria-invalid={!!errorCalle} {...register("calle" as Path<T>)} />
        </div>
        <div className="grid w-28 gap-1">
          <Label htmlFor="altura" className="text-xs font-normal text-muted-foreground">
            Altura
          </Label>
          <Input
            id="altura"
            inputMode="numeric"
            aria-invalid={!!errorAltura}
            {...register("altura" as Path<T>)}
          />
        </div>
      </div>
      {(errorCalle || errorAltura) && (
        <p className="text-sm text-destructive">{errorCalle ?? errorAltura}</p>
      )}

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="piso" className="text-xs font-normal text-muted-foreground">
            Piso (opcional)
          </Label>
          <Input id="piso" {...register("piso" as Path<T>)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="dpto" className="text-xs font-normal text-muted-foreground">
            Dpto (opcional)
          </Label>
          <Input id="dpto" {...register("dpto" as Path<T>)} />
        </div>
      </div>
    </div>
  );
}
