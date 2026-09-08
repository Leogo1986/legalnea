import { z } from "zod";
import { telefonoArgentinoSchema } from "@/lib/validation/abogado.schema";

// Datos editables del perfil de admin — a diferencia de abogado/cliente, el
// admin no tiene tabla propia con domicilio: solo nombre y teléfono viven en
// `perfiles`. Email queda fuera (identificador de login, no editable acá).
export const adminPerfilSchema = z.object({
  nombre_completo: z.string().trim().min(3, "Ingresá tu nombre y apellido completo").max(150),
  telefono: telefonoArgentinoSchema,
});

export type AdminPerfilInput = z.infer<typeof adminPerfilSchema>;
