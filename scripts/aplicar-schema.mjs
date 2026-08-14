// Aplica supabase/migrations/*.sql y opcionalmente supabase/seed/seed.sql
// directo contra la base, sin depender de la Supabase CLI logueada.
//
// Uso:
//   node scripts/aplicar-schema.mjs             # solo migraciones
//   node scripts/aplicar-schema.mjs --seed       # migraciones + seed
//
// Requiere SUPABASE_DB_URL en el entorno, ej:
//   postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Falta SUPABASE_DB_URL en el entorno.");
  process.exit(1);
}

const incluirSeed = process.argv.includes("--seed");

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const archivos = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

for (const archivo of archivos) {
  console.log(`→ Aplicando ${archivo}...`);
  const sql = readFileSync(join(migrationsDir, archivo), "utf8");
  await client.query(sql);
  console.log(`✅ ${archivo}`);
}

if (incluirSeed) {
  console.log("→ Aplicando seed...");
  const sql = readFileSync(join(process.cwd(), "supabase", "seed", "seed.sql"), "utf8");
  await client.query(sql);
  console.log("✅ seed.sql");
}

await client.end();
console.log("Listo.");
