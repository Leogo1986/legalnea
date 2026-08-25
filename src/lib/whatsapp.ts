// Normaliza un teléfono argentino (como los que acepta telefonoArgentinoSchema,
// ej "+54 9 3795 089816" o "3795089816") a solo dígitos para armar un link
// wa.me. Si ya viene con código de país lo deja tal cual; si no, asume
// Argentina (54 9 ...) — mismo criterio que CONTACTO_TELEFONO_E164 en
// lib/constants.ts.
export function normalizarTelefonoWhatsapp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("54")) return digitos;
  if (digitos.startsWith("9")) return `54${digitos}`;
  return `549${digitos}`;
}

export function armarLinkWhatsapp(telefono: string, mensaje: string): string {
  return `https://wa.me/${normalizarTelefonoWhatsapp(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

// Mensaje prearmado para el botón manual de "avisar aprobación" en
// admin/solicitudes: el admin lo revisa/edita en WhatsApp antes de mandarlo.
export function mensajeSolicitudAprobada(nombre: string, email: string, siteUrl: string): string {
  const primerNombre = nombre.trim().split(" ")[0] || nombre;
  return (
    `Hola ${primerNombre}, te escribimos del estudio jurídico Legal Nea. ` +
    `Tu solicitud de asistencia legal gratuita fue aprobada ✅. En breve un ` +
    `abogado de nuestra red PROBONO se va a poner en contacto con vos. ` +
    `Para ingresar a tu cuenta, entrá a ${siteUrl}/login y usá la opción ` +
    `"Olvidé mi contraseña" con tu email (${email}) para crear tu clave. ` +
    `¡Gracias por confiar en Legal Nea!`
  );
}
