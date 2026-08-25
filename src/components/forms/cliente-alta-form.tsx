"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComboboxProvincia } from "@/components/shared/combobox-provincia";
import { DomicilioFields } from "@/components/shared/domicilio-fields";
import { SelectLocalidad } from "@/components/shared/select-localidad";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { clienteAltaSchema, type ClienteAltaInput } from "@/lib/validation/cliente.schema";
import { crearSolicitudCliente } from "@/app/(public)/clientes/nuevo/actions";
import { CONTACTO_WHATSAPP_URL } from "@/lib/constants";

const valoresPorDefecto: ClienteAltaInput = {
  nombre_completo: "",
  telefono: "",
  email: "",
  calle: "",
  altura: "",
  piso: "",
  dpto: "",
  provincia: "",
  localidad: "",
  motivo_consulta: "",
  declaracion_veracidad_aceptada: false,
};

export function ClienteAltaForm() {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClienteAltaInput>({
    resolver: zodResolver(clienteAltaSchema),
    defaultValues: valoresPorDefecto,
  });

  const [archivos, setArchivos] = React.useState<File[]>([]);
  const [enviando, setEnviando] = React.useState(false);
  const [enviado, setEnviado] = React.useState(false);

  async function onSubmit(datos: ClienteAltaInput) {
    setEnviando(true);
    const formData = new FormData();
    formData.set("nombre_completo", datos.nombre_completo);
    formData.set("telefono", datos.telefono);
    formData.set("email", datos.email);
    formData.set("calle", datos.calle);
    formData.set("altura", datos.altura);
    formData.set("piso", datos.piso ?? "");
    formData.set("dpto", datos.dpto ?? "");
    formData.set("provincia", datos.provincia);
    formData.set("localidad", datos.localidad);
    formData.set("motivo_consulta", datos.motivo_consulta);
    formData.set(
      "declaracion_veracidad_aceptada",
      String(datos.declaracion_veracidad_aceptada)
    );
    for (const archivo of archivos) formData.append("archivos", archivo);

    const res = await crearSolicitudCliente(formData);
    setEnviando(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-12 text-primary" />
          <h2 className="font-heading text-lg font-semibold">¡Listo!</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tu solicitud fue recibida. Va a estar sujeta a la aprobación del
            equipo del estudio jurídico Legal Nea, que va a evaluarla junto
            con un abogado especialista de nuestra red PROBONO. Te vamos a
            notificar la novedad en un plazo de hasta 48 horas. ¡Gracias por
            confiar en nosotros!
          </p>
          <Button
            variant="ghost"
            size="sm"
            render={<a href={CONTACTO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />}
          >
            Escribinos por WhatsApp
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HeartHandshake className="size-5 text-primary" />
          <CardTitle>Pedí ayuda legal gratuita</CardTitle>
        </div>
        <CardDescription>
          Contanos tu situación. Es gratuito y un abogado voluntario de
          nuestra red va a evaluar tu caso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="nombre_completo">Nombre y apellido</Label>
            <Input
              id="nombre_completo"
              aria-invalid={!!errors.nombre_completo}
              {...register("nombre_completo")}
            />
            {errors.nombre_completo && (
              <p className="text-sm text-destructive">{errors.nombre_completo.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="telefono">Celular / WhatsApp</Label>
              <Input
                id="telefono"
                placeholder="+54 9 3795 089816"
                aria-invalid={!!errors.telefono}
                {...register("telefono")}
              />
              {errors.telefono && (
                <p className="text-sm text-destructive">{errors.telefono.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <DomicilioFields register={register} errors={errors} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="provincia">Provincia</Label>
              <Controller
                control={control}
                name="provincia"
                render={({ field }) => (
                  <ComboboxProvincia
                    id="provincia"
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("localidad", "", { shouldValidate: true });
                    }}
                  />
                )}
              />
              {errors.provincia && (
                <p className="text-sm text-destructive">{errors.provincia.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="localidad">Localidad</Label>
              <Controller
                control={control}
                name="localidad"
                render={({ field }) => (
                  <SelectLocalidad
                    id="localidad"
                    provincia={watch("provincia")}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.localidad && (
                <p className="text-sm text-destructive">{errors.localidad.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="motivo_consulta">Motivo de la consulta</Label>
            <Textarea
              id="motivo_consulta"
              rows={5}
              placeholder="Contanos qué te pasa, con el mayor detalle posible..."
              aria-invalid={!!errors.motivo_consulta}
              {...register("motivo_consulta")}
            />
            {errors.motivo_consulta && (
              <p className="text-sm text-destructive">{errors.motivo_consulta.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Adjuntar documentación (opcional)</Label>
            <FileDropzone archivos={archivos} onChange={setArchivos} />
          </div>

          <Controller
            control={control}
            name="declaracion_veracidad_aceptada"
            render={({ field }) => (
              <Alert>
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="declaracion_veracidad"
                    checked={field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <AlertTitle>Declaración de veracidad</AlertTitle>
                    <AlertDescription>
                      <Label htmlFor="declaracion_veracidad" className="font-normal">
                        Declaro que la información que relaté en este
                        formulario es veraz y me hago responsable por su
                        exactitud.
                      </Label>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          />
          {errors.declaracion_veracidad_aceptada && (
            <p className="-mt-3 text-sm text-destructive">
              {errors.declaracion_veracidad_aceptada.message}
            </p>
          )}

          <Button type="submit" size="lg" disabled={enviando} className="mt-2">
            {enviando && <Loader2 className="animate-spin" />}
            Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
