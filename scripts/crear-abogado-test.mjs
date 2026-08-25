// Crea un abogado de prueba YA aprobado (sin pasar por el flujo de alta
// pública + aprobación del admin) con cuenta de Auth lista para loguear.
// Uso: node scripts/crear-abogado-test.mjs <email> <password> ["Nombre Apellido"]
import { createClient } from "@supabase/supabase-js";

const [, , email, password, nombreCompleto = "Abogado de Prueba"] = process.argv;
if (!email || !password) {
  console.error('Uso: node scripts/crear-abogado-test.mjs <email> <password> ["Nombre"]');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: abogado, error: errAbogado } = await admin
  .from("abogados")
  .insert({
    nombre_completo: nombreCompleto,
    telefono: "3795000000",
    direccion: "Domicilio de prueba",
    provincia: "Corrientes",
    localidad: "Corrientes",
    email,
    estado: "aprobado",
    acepto_declaracion_jurada: true,
    fecha_aceptacion_dj: new Date().toISOString(),
  })
  .select("id")
  .single();

if (errAbogado || !abogado) {
  console.error("No se pudo crear el abogado:", errAbogado);
  process.exit(1);
}

const { data: creado, error: errCreate } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (errCreate || !creado.user) {
  console.error("No se pudo crear la cuenta de Auth:", errCreate);
  process.exit(1);
}

await admin.from("perfiles").upsert({
  id: creado.user.id,
  rol: "abogado",
  nombre_completo: nombreCompleto,
  email,
});
await admin.from("abogados").update({ user_id: creado.user.id }).eq("id", abogado.id);

console.log(`OK: abogado ${email} creado y aprobado, user_id ${creado.user.id}`);
