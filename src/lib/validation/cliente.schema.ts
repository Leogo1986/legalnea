import { z } from "zod";
import {
  emailSchema,
  telefonoArgentinoSchema,
  calleSchema,
  alturaSchema,
  pisoDptoSchema,
} from "./abogado.schema";

export const MAX_ARCHIVOS_SOLICITUD = 5;
export const MAX_TAMANIO_ARCHIVO_BYTES = 10 * 1024 * 1024; // 10MB
export const TIPOS_MIME_PERMITIDOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
] as const;

// Formulario público de alta de cliente (/clientes/nuevo)
export const clienteAltaSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, "Ingresá tu nombre y apellido completo")
    .max(150),
  telefono: telefonoArgentinoSchema,
  email: emailSchema,
  calle: calleSchema,
  altura: alturaSchema,
  piso: pisoDptoSchema,
  dpto: pisoDptoSchema,
  provincia: z.string().trim().min(2, "Seleccioná o ingresá tu provincia"),
  localidad: z.string().trim().min(2, "Ingresá tu localidad"),
  motivo_consulta: z
    .string()
    .trim()
    .min(20, "Contanos con un poco más de detalle tu consulta")
    .max(3000, "Máximo 3000 caracteres"),
  declaracion_veracidad_aceptada: z
    .boolean()
    .refine((v) => v === true, {
      message:
        "Debés declarar que la información es veraz para poder enviar la solicitud",
    }),
});

export type ClienteAltaInput = z.infer<typeof clienteAltaSchema>;

// Validación client-side de cada archivo adjunto antes de subir a Storage
export function validarArchivoAdjunto(file: File): string | null {
  if (!TIPOS_MIME_PERMITIDOS.includes(file.type as (typeof TIPOS_MIME_PERMITIDOS)[number])) {
    return `Formato no permitido: ${file.name}. Solo PDF, DOC, DOCX, JPG o PNG.`;
  }
  if (file.size > MAX_TAMANIO_ARCHIVO_BYTES) {
    return `El archivo "${file.name}" supera los 10MB.`;
  }
  return null;
}
