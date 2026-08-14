import { z } from "zod";
import { emailSchema } from "./abogado.schema";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const recuperarPasswordSchema = z.object({
  email: emailSchema,
});
export type RecuperarPasswordInput = z.infer<typeof recuperarPasswordSchema>;

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72)
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");

export const nuevaPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmar_password: z.string(),
  })
  .refine((data) => data.password === data.confirmar_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_password"],
  });
export type NuevaPasswordInput = z.infer<typeof nuevaPasswordSchema>;
