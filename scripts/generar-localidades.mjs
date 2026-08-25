// Genera src/lib/data/localidades.generated.ts a partir del dataset oficial
// de la API georef de datos.gob.ar (INDEC). Se corre una sola vez a mano —
// el resultado queda commiteado, no hay fetch en runtime.
//
// Uso:
//   node scripts/generar-localidades.mjs

import { writeFileSync } from "node:fs";
import { join } from "node:path";

// id georef -> nombre tal como aparece en PROVINCIAS_ARGENTINA
// (src/lib/data/provincias.ts). La API georef nombra Tierra del Fuego con
// el nombre completo oficial; acá se mapea al nombre corto que ya usa el
// resto de la app.
const PROVINCIAS = [
  ["06", "Buenos Aires"],
  ["02", "Ciudad Autónoma de Buenos Aires"],
  ["10", "Catamarca"],
  ["22", "Chaco"],
  ["26", "Chubut"],
  ["14", "Córdoba"],
  ["18", "Corrientes"],
  ["30", "Entre Ríos"],
  ["34", "Formosa"],
  ["38", "Jujuy"],
  ["42", "La Pampa"],
  ["46", "La Rioja"],
  ["50", "Mendoza"],
  ["54", "Misiones"],
  ["58", "Neuquén"],
  ["62", "Río Negro"],
  ["66", "Salta"],
  ["70", "San Juan"],
  ["74", "San Luis"],
  ["78", "Santa Cruz"],
  ["82", "Santa Fe"],
  ["86", "Santiago del Estero"],
  ["94", "Tierra del Fuego"],
  ["90", "Tucumán"],
];

async function fetchLocalidades(idProvincia) {
  const url = new URL("https://apis.datos.gob.ar/georef/api/localidades");
  url.searchParams.set("provincia", idProvincia);
  url.searchParams.set("campos", "nombre");
  url.searchParams.set("max", "5000");
  url.searchParams.set("aplanar", "true");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`georef ${idProvincia}: HTTP ${res.status}`);
  const data = await res.json();
  const nombres = data.localidades.map((l) => l.nombre.trim());
  return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b, "es"));
}

const resultado = {};
for (const [id, nombre] of PROVINCIAS) {
  process.stdout.write(`→ ${nombre}... `);
  const localidades = await fetchLocalidades(id);
  resultado[nombre] = localidades;
  console.log(`${localidades.length} localidades`);
}

const salida = `// Generado por scripts/generar-localidades.mjs a partir de la API georef de
// datos.gob.ar (INDEC) — no editar a mano, volver a correr el script si hace
// falta actualizar el dataset.
import type { Provincia } from "./provincias";

export const LOCALIDADES_POR_PROVINCIA: Record<Provincia, string[]> = ${JSON.stringify(resultado, null, 2)};
`;

const destino = join(process.cwd(), "src", "lib", "data", "localidades.generated.ts");
writeFileSync(destino, salida, "utf8");
console.log(`\n✅ Escrito ${destino}`);
