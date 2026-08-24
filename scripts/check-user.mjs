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
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

let user;
let page = 1;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error(error); process.exit(1); }
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (user || data.users.length === 0) break;
  page++;
}
if (!user) { console.log("no existe"); process.exit(0); }
console.log(JSON.stringify({
  id: user.id,
  email: user.email,
  email_confirmed_at: user.email_confirmed_at,
  confirmed_at: user.confirmed_at,
  banned_until: user.banned_until,
  last_sign_in_at: user.last_sign_in_at,
}, null, 2));

const { data: perfil } = await admin.from("perfiles").select("*").eq("id", user.id).maybeSingle();
console.log("perfil:", JSON.stringify(perfil, null, 2));
