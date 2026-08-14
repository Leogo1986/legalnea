// Crea (o promueve) la cuenta de Administrador. No hay alta pública de
// admins (ver prompt maestro, "Flujo de autenticación") — se corre a mano
// una sola vez por entorno.
//
// Uso:
//   node scripts/crear-admin.mjs admin@legalnea.com "Nombre Apellido"
//
// Requiere en el entorno (o en un .env.local cargado antes):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Genera una contraseña temporal aleatoria y la imprime en consola — cambiarla
// después de loguearse por primera vez (o correr "recuperar contraseña").

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const [, , email, ...nombreParts] = process.argv;
const nombreCompleto = nombreParts.join(" ") || "Administrador";

if (!email) {
  console.error('Uso: node scripts/crear-admin.mjs admin@legalnea.com "Nombre Apellido"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const passwordTemporal = randomBytes(9).toString("base64url");

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password: passwordTemporal,
  email_confirm: true,
});

if (error || !data.user) {
  console.error("No se pudo crear el usuario:", error?.message);
  process.exit(1);
}

const { error: errorPerfil } = await supabase.from("perfiles").upsert({
  id: data.user.id,
  rol: "admin",
  nombre_completo: nombreCompleto,
  email,
});

if (errorPerfil) {
  console.error("Usuario creado en Auth pero falló el perfil:", errorPerfil.message);
  process.exit(1);
}

console.log("✅ Admin creado.");
console.log(`   Email:    ${email}`);
console.log(`   Password: ${passwordTemporal}  (cambiala después de tu primer login)`);
