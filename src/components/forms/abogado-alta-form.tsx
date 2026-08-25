"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboboxProvincia } from "@/components/shared/combobox-provincia";
import { DomicilioFields } from "@/components/shared/domicilio-fields";
import { SelectLocalidad } from "@/components/shared/select-localidad";
import { DeclaracionJuradaModal } from "@/components/forms/declaracion-jurada-modal";
import { MartilloExito } from "@/components/forms/martillo-exito";
import { TarjetaAbogado } from "@/components/public/tarjeta-abogado";
import {
  abogadoAltaSchema,
  type AbogadoAltaInput,
} from "@/lib/validation/abogado.schema";
import { crearAbogado } from "@/app/(public)/abogados/nuevo/actions";
import { CONTACTO_TELEFONO_DISPLAY, CONTACTO_WHATSAPP_URL } from "@/lib/constants";
import type { CategoriaEspecialidad } from "@/types/database";

type Especialidad = {
  id: string;
  nombre: string;
  categoria: CategoriaEspecialidad;
};

type AbogadoExito = {
  id: string;
  nombre_completo: string;
  provincia: string;
  fecha_alta: string;
  especialidades: string[];
};

const valoresPorDefecto: AbogadoAltaInput = {
  nombre_completo: "",
  telefono: "",
  calle: "",
  altura: "",
  piso: "",
  dpto: "",
  provincia: "",
  localidad: "",
  codigo_postal: "",
  matricula_federal: "",
  matricula_provincial: "",
  email: "",
  especialidad_ids: [],
};

export function AbogadoAltaForm({ especialidades }: { especialidades: Especialidad[] }) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting: validando },
  } = useForm<AbogadoAltaInput>({
    resolver: zodResolver(abogadoAltaSchema),
    defaultValues: valoresPorDefecto,
  });

  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [datosPendientes, setDatosPendientes] = React.useState<AbogadoAltaInput | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<AbogadoExito | null>(null);
  const [mostrarOptimista, setMostrarOptimista] = React.useState(false);
  const [slotOptimista, setSlotOptimista] = React.useState<HTMLElement | null>(null);

  function onFormularioValido(datos: AbogadoAltaInput) {
    setDatosPendientes(datos);
    setModalAbierto(true);
  }

  async function onAceptarDeclaracion() {
    if (!datosPendientes) return;
    setEnviando(true);
    const res = await crearAbogado({
      ...datosPendientes,
      acepto_declaracion_jurada: true,
    });
    setEnviando(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setModalAbierto(false);
    setResultado(res.abogado);
  }

  // 1.5s después del envío exitoso: scroll suave al listado + destacar la
  // tarjeta recién agregada (vía portal, ya que el abogado queda "pendiente"
  // y el listado en vivo solo muestra aprobados).
  React.useEffect(() => {
    if (!resultado) return;
    const timeout = setTimeout(() => {
      document
        .getElementById("listado-abogados")
        ?.scrollIntoView({ behavior: "smooth" });
      setSlotOptimista(document.getElementById("listado-optimista-slot"));
      setMostrarOptimista(true);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [resultado]);

  const especialidadesPorCategoria = React.useMemo(() => {
    const prioritarias = especialidades.filter((e) => e.categoria === "prioritaria_probono");
    const generales = especialidades.filter((e) => e.categoria === "general");
    return { prioritarias, generales };
  }, [especialidades]);

  if (resultado) {
    return (
      <>
        <Card className="mx-auto max-w-xl">
          <CardContent className="pt-6">
            <MartilloExito
              mensaje={`¡Felicitaciones! Tus datos fueron enviados para ser evaluados por nuestro equipo. En un plazo de hasta 48 horas hábiles vas a recibir un email con la novedad. Si pasado ese plazo no tenés noticias nuestras, escribinos al ${CONTACTO_TELEFONO_DISPLAY} y con gusto te ayudamos.`}
            />
            <div className="mt-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                render={<a href={CONTACTO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />}
              >
                Escribinos por WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {mostrarOptimista &&
          slotOptimista &&
          createPortal(
            <TarjetaAbogado
              nombre={resultado.nombre_completo}
              provincia={resultado.provincia}
              especialidades={resultado.especialidades}
              fechaAlta={resultado.fecha_alta}
              pendiente
              destacar
            />,
            slotOptimista
          )}
      </>
    );
  }

  return (
    <>
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="border-b bg-gradient-to-br from-primary/8 to-transparent">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Scale className="size-5" />
            </span>
            <CardTitle className="text-xl">Sumate a la red PROBONO</CardTitle>
          </div>
          <CardDescription>
            Completá tus datos. No hace falta tener cuenta creada — la vas a
            recibir por email si tu inscripción es aprobada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormularioValido)} className="grid gap-5" noValidate>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="codigo_postal">Código postal</Label>
                <Input id="codigo_postal" {...register("codigo_postal")} />
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
            {errors.matricula_federal && (
              <p className="-mt-3 text-sm text-destructive">{errors.matricula_federal.message}</p>
            )}

            <div className="grid gap-2">
              <Label>Área de actuación</Label>
              <p className="text-xs text-muted-foreground">
                Elegí al menos una. Podés marcar varias.
              </p>
              <Controller
                control={control}
                name="especialidad_ids"
                render={({ field }) => (
                  <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border p-3">
                    {especialidadesPorCategoria.prioritarias.length > 0 && (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          Áreas prioritarias PROBONO
                          <Badge variant="secondary" className="text-[0.65rem]">
                            recomendadas
                          </Badge>
                        </p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {especialidadesPorCategoria.prioritarias.map((esp) => (
                            <CheckboxEspecialidad
                              key={esp.id}
                              especialidad={esp}
                              checked={field.value.includes(esp.id)}
                              onChange={(checked) => {
                                field.onChange(
                                  checked
                                    ? [...field.value, esp.id]
                                    : field.value.filter((id) => id !== esp.id)
                                );
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Todas las especialidades
                      </p>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {especialidadesPorCategoria.generales.map((esp) => (
                          <CheckboxEspecialidad
                            key={esp.id}
                            especialidad={esp}
                            checked={field.value.includes(esp.id)}
                            onChange={(checked) => {
                              field.onChange(
                                checked
                                  ? [...field.value, esp.id]
                                  : field.value.filter((id) => id !== esp.id)
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              />
              {errors.especialidad_ids && (
                <p className="text-sm text-destructive">{errors.especialidad_ids.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={validando} className="mt-2">
              {validando && <Loader2 className="animate-spin" />}
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>

      {datosPendientes && (
        <DeclaracionJuradaModal
          open={modalAbierto}
          onOpenChange={setModalAbierto}
          enviando={enviando}
          onAceptar={onAceptarDeclaracion}
          datos={{
            nombreCompleto: datosPendientes.nombre_completo,
            email: datosPendientes.email,
            provincia: datosPendientes.provincia,
            matriculaFederal: datosPendientes.matricula_federal,
            matriculaProvincial: datosPendientes.matricula_provincial,
          }}
        />
      )}
    </>
  );
}

function CheckboxEspecialidad({
  especialidad,
  checked,
  onChange,
}: {
  especialidad: Especialidad;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = `especialidad-${especialidad.id}`;
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onChange(c === true)}
      />
      <Label htmlFor={id} className="font-normal">
        {especialidad.nombre}
      </Label>
    </div>
  );
}
