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
  console.error("uso: node scripts/set-password.mjs <email> <password>");
  process.exit(1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

let user;
let page = 1;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("listUsers error:", error); process.exit(1); }
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (user || data.users.length === 0) break;
  page++;
}

if (!user) {
  console.error(`No existe usuario Auth con email ${email}`);
  process.exit(1);
}

const { error: errUpdate } = await admin.auth.admin.updateUserById(user.id, { password });
if (errUpdate) {
  console.error("updateUserById error:", errUpdate);
  process.exit(1);
}

console.log(`OK: password actualizada para ${email} (user id ${user.id})`);
