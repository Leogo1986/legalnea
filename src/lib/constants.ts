// Datos de contacto y branding centralizados de Legal Nea Soft.
// Teléfono confirmado por el usuario (prioridad sobre cualquier placeholder del prompt maestro).
export const SITE_NAME = "Legal Nea Soft";
export const SITE_TAGLINE = "Red PROBONO de Legal Nea";

export const CONTACTO_TELEFONO_DISPLAY = "3795 089816";
export const CONTACTO_TELEFONO_E164 = "5493795089816";
export const CONTACTO_WHATSAPP_URL = `https://wa.me/${CONTACTO_TELEFONO_E164}`;

export const ADMIN_EMAIL = "bitcorrientes@gmail.com";

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/abogados/nuevo", label: "Sumate como abogado" },
  { href: "/clientes/nuevo", label: "Pedí ayuda legal" },
] as const;
