// Crea un cliente de prueba con cuenta de Auth lista para loguear (sin pasar
// por el formulario público /clientes/nuevo).
// Uso: node scripts/crear-cliente-test.mjs <email> <password> ["Nombre Apellido"]
import { createClient } from "@supabase/supabase-js";

const [, , email, password, nombreCompleto = "Cliente de Prueba"] = process.argv;
if (!email || !password) {
  console.error('Uso: node scripts/crear-cliente-test.mjs <email> <password> ["Nombre"]');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: cliente, error: errCliente } = await admin
  .from("clientes")
  .insert({
    nombre_completo: nombreCompleto,
    telefono: "3795000000",
    direccion: "Domicilio de prueba",
    provincia: "Corrientes",
    localidad: "Corrientes",
    email,
  })
  .select("id")
  .single();

if (errCliente || !cliente) {
  console.error("No se pudo crear el cliente:", errCliente);
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
  rol: "cliente",
  nombre_completo: nombreCompleto,
  email,
});
await admin.from("clientes").update({ user_id: creado.user.id }).eq("id", cliente.id);

console.log(`OK: cliente ${email} creado, user_id ${creado.user.id}`);
