import "server-only";
import { randomBytes } from "node:crypto";

// Clave temporal legible para mandar por WhatsApp (no por mail — esquiva
// Resend a propósito). base64url: solo [A-Za-z0-9_-], sin caracteres que se
// rompan al copiar/pegar en el chat.
export function generarPasswordTemporal(): string {
  return randomBytes(9).toString("base64url");
}
