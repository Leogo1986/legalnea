// Arma el texto compuesto de `direccion` a partir de los campos partidos
// (calle/altura/piso/dpto) — se guarda igual en la columna `direccion` para
// no romper los lugares que ya la leen como texto (detalle-caso-abogado.tsx,
// etc.), aunque la carga real ahora sea con 4 campos separados.
export function componerDireccion(datos: {
  calle: string;
  altura: string;
  piso?: string | null;
  dpto?: string | null;
}): string {
  let direccion = `${datos.calle.trim()} ${datos.altura.trim()}`.trim();
  if (datos.piso?.trim()) direccion += `, Piso ${datos.piso.trim()}`;
  if (datos.dpto?.trim()) direccion += `, Dpto ${datos.dpto.trim()}`;
  return direccion;
}
