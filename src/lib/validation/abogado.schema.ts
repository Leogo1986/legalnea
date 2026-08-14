import { z } from "zod";

// Validación de celular argentino: acepta formatos como
// "+54 9 3795 089816", "3795089816", "011 4444-5555", etc.
export const telefonoArgentinoSchema = z
  .string()
  .trim()
  .min(8, "Ingresá un número de celular válido")
  .regex(
    /^(\+?54)?\s?(9)?\s?[\d\s-]{8,14}$/,
    "Ingresá un número de celular argentino válido (ej: +54 9 3795 089816)"
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ingresá un email válido");

// Paso 1: datos del formulario público de alta de abogado (/abogados/nuevo)
export const abogadoAltaSchema = z
  .object({
    nombre_completo: z
      .string()
      .trim()
      .min(3, "Ingresá tu nombre y apellido completo")
      .max(150),
    telefono: telefonoArgentinoSchema,
    direccion: z.string().trim().min(3, "Ingresá tu domicilio").max(255),
    provincia: z.string().trim().min(2, "Seleccioná o ingresá tu provincia"),
    localidad: z.string().trim().min(2, "Ingresá tu localidad"),
    codigo_postal: z.string().trim().max(15).optional().or(z.literal("")),
    matricula_federal: z.string().trim().max(100).optional().or(z.literal("")),
    matricula_provincial: z.string().trim().max(100).optional().or(z.literal("")),
    email: emailSchema,
    especialidad_ids: z
      .array(z.string().uuid())
      .min(1, "Elegí al menos un área de actuación"),
  })
  .refine(
    (data) =>
      (data.matricula_federal && data.matricula_federal.length > 0) ||
      (data.matricula_provincial && data.matricula_provincial.length > 0),
    {
      message: "Ingresá al menos una matrícula (federal o provincial)",
      path: ["matricula_federal"],
    }
  );

export type AbogadoAltaInput = z.infer<typeof abogadoAltaSchema>;

// Paso 2: aceptación de la Declaración Jurada (checkbox obligatorio en el modal)
export const declaracionJuradaSchema = z.object({
  acepto_declaracion_jurada: z
    .boolean()
    .refine((v) => v === true, {
      message: "Debés leer y aceptar la Declaración Jurada para continuar",
    }),
});

export type DeclaracionJuradaInput = z.infer<typeof declaracionJuradaSchema>;

// Schema completo que se envía al server action
export const abogadoAltaCompletoSchema = abogadoAltaSchema.and(declaracionJuradaSchema);
export type AbogadoAltaCompletoInput = z.infer<typeof abogadoAltaCompletoSchema>;
