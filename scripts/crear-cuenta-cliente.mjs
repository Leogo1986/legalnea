import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error("uso: node scripts/crear-cuenta-cliente.mjs <email> <password>");
  process.exit(1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: cliente, error: errCliente } = await admin
  .from("clientes")
  .select("id, nombre_completo, user_id")
  .eq("email", email)
  .maybeSingle();
if (errCliente || !cliente) {
  console.error("No existe cliente con ese email:", errCliente);
  process.exit(1);
}

let userId = cliente.user_id;

if (!userId) {
  const { data: invitado, error: errInvite } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: "http://localhost/noop" },
  });
  if (errInvite || !invitado?.user) {
    console.error("generateLink falló:", errInvite);
    process.exit(1);
  }
  userId = invitado.user.id;
  await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  await admin.from("perfiles").upsert({
    id: userId,
    rol: "cliente",
    nombre_completo: cliente.nombre_completo,
    email,
  });
  await admin.from("clientes").update({ user_id: userId }).eq("id", cliente.id);
  console.log("Cuenta creada, user_id:", userId);
} else {
  console.log("Ya tenía cuenta, user_id:", userId);
}

const { error: errPass } = await admin.auth.admin.updateUserById(userId, { password });
if (errPass) {
  console.error("No se pudo setear password:", errPass);
  process.exit(1);
}
console.log(`OK: password seteada para ${email}`);
