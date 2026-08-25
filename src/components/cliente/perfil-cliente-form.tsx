"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Save, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ComboboxProvincia } from "@/components/shared/combobox-provincia";
import { DomicilioFields } from "@/components/shared/domicilio-fields";
import { SelectLocalidad } from "@/components/shared/select-localidad";
import { clienteEditarSchema, type ClienteEditarInput } from "@/lib/validation/cliente.schema";
import { actualizarPerfilCliente } from "@/app/cliente/perfil/actions";

export function PerfilClienteForm({
  cliente,
}: {
  cliente: {
    nombre_completo: string;
    email: string;
    telefono: string;
    calle: string | null;
    altura: string | null;
    piso: string | null;
    dpto: string | null;
    provincia: string;
    localidad: string;
  };
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClienteEditarInput>({
    resolver: zodResolver(clienteEditarSchema),
    defaultValues: {
      nombre_completo: cliente.nombre_completo,
      telefono: cliente.telefono,
      calle: cliente.calle ?? "",
      altura: cliente.altura ?? "",
      piso: cliente.piso ?? "",
      dpto: cliente.dpto ?? "",
      provincia: cliente.provincia,
      localidad: cliente.localidad,
    },
  });

  const [guardando, setGuardando] = React.useState(false);

  async function onSubmit(datos: ClienteEditarInput) {
    setGuardando(true);
    const res = await actualizarPerfilCliente(datos);
    setGuardando(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Datos actualizados.");
  }

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-br from-primary/8 to-transparent">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-primary" />
          <CardTitle className="text-lg">Mis datos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6" noValidate>
          <div className="grid gap-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Mail className="size-3.5" /> Datos de contacto
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email (no editable)</Label>
              <Input id="email" value={cliente.email} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <MapPin className="size-3.5" /> Domicilio
            </p>
            <DomicilioFields register={register} errors={errors} />
            <div className="grid gap-4 sm:grid-cols-2">
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
