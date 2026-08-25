"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboboxProvincia } from "@/components/shared/combobox-provincia";
import { DomicilioFields } from "@/components/shared/domicilio-fields";
import { SelectLocalidad } from "@/components/shared/select-localidad";
import {
  abogadoDatosSchema,
  validarAlMenosUnaMatricula,
  REFINEMENT_MATRICULA,
} from "@/lib/validation/abogado.schema";
import { actualizarPerfilAbogado } from "@/app/abogado/perfil/actions";
import { z } from "zod";

const editarPerfilSchema = abogadoDatosSchema
  .omit({ especialidad_ids: true, email: true })
  .refine(validarAlMenosUnaMatricula, REFINEMENT_MATRICULA);

type EditarPerfilInput = z.infer<typeof editarPerfilSchema>;

export function PerfilAbogadoForm({
  abogado,
}: {
  abogado: {
    nombre_completo: string;
    email: string;
    telefono: string;
    calle: string | null;
    altura: string | null;
    piso: string | null;
    dpto: string | null;
    provincia: string;
    localidad: string;
    codigo_postal: string | null;
    matricula_federal: string | null;
    matricula_provincial: string | null;
  };
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditarPerfilInput>({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: {
      nombre_completo: abogado.nombre_completo,
      telefono: abogado.telefono,
      calle: abogado.calle ?? "",
      altura: abogado.altura ?? "",
      piso: abogado.piso ?? "",
      dpto: abogado.dpto ?? "",
      provincia: abogado.provincia,
      localidad: abogado.localidad,
      codigo_postal: abogado.codigo_postal ?? "",
      matricula_federal: abogado.matricula_federal ?? "",
      matricula_provincial: abogado.matricula_provincial ?? "",
    },
  });

  const [guardando, setGuardando] = React.useState(false);

  async function onSubmit(datos: EditarPerfilInput) {
    setGuardando(true);
    const res = await actualizarPerfilAbogado(datos);
    setGuardando(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Datos actualizados.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis datos</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email (no editable)</Label>
            <Input id="email" value={abogado.email} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nombre_completo">Nombre y apellido</Label>
            <Input id="nombre_completo" {...register("nombre_completo")} />
            {errors.nombre_completo && (
              <p className="text-sm text-destructive">{errors.nombre_completo.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="telefono">Celular / WhatsApp</Label>
            <Input id="telefono" {...register("telefono")} />
            {errors.telefono && (
              <p className="text-sm text-destructive">{errors.telefono.message}</p>
            )}
          </div>

          <DomicilioFields register={register} errors={errors} />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="provincia">Provincia</Label>
              <Controller
                control={control}
                name="provincia"
                render={({ field }) => (
                  <ComboboxProvincia
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("localidad", "", { shouldValidate: true });
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="localidad">Localidad</Label>
              <Controller
                control={control}
                name="localidad"
                render={({ field }) => (
                  <SelectLocalidad
                    provincia={watch("provincia")}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="codigo_postal">Código postal</Label>
              <Input id="codigo_postal" {...register("codigo_postal")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="matricula_federal">Matrícula federal</Label>
              <Input id="matricula_federal" {...register("matricula_federal")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="matricula_provincial">Matrícula provincial</Label>
              <Input id="matricula_provincial" {...register("matricula_provincial")} />
            </div>
          </div>
          <Button type="submit" disabled={guardando} className="mt-2 w-fit">
            {guardando ? <Loader2 className="animate-spin" /> : <Save />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
