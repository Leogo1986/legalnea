import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TarjetaAbogado } from "@/components/public/tarjeta-abogado";

const POR_PAGINA = 12;

type AbogadoListado = {
  id: string;
  nombre_completo: string;
  provincia: string;
  fecha_alta: string;
  especialidades: string[];
};

async function getAbogadosAprobados(pagina: number): Promise<{
  abogados: AbogadoListado[];
  total: number;
}> {
  const supabase = await createClient();
  const desde = 0;
  const hasta = pagina * POR_PAGINA - 1;

  const { data, count, error } = await supabase
    .from("abogados")
    .select(
      "id, nombre_completo, provincia, fecha_alta, abogado_especialidades(especialidades(nombre))",
      { count: "exact" }
    )
    .eq("estado", "aprobado")
    .order("fecha_alta", { ascending: false })
    .range(desde, hasta);

  if (error || !data) {
    return { abogados: [], total: 0 };
  }

  const abogados: AbogadoListado[] = data.map((a) => {
    const especialidades = Array.isArray(a.abogado_especialidades)
      ? a.abogado_especialidades
          .map((ae) =>
            ae && typeof ae === "object" && "especialidades" in ae
              ? (ae as { especialidades: { nombre: string } | null }).especialidades?.nombre
              : undefined
          )
          .filter((n): n is string => Boolean(n))
      : [];

    return {
      id: a.id,
      nombre_completo: a.nombre_completo,
      provincia: a.provincia,
      fecha_alta: a.fecha_alta,
      especialidades,
    };
  });

  return { abogados, total: count ?? abogados.length };
}

export async function ListadoAbogados({ pagina = 1 }: { pagina?: number }) {
  const paginaActual = Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1;
  const { abogados, total } = await getAbogadosAprobados(paginaActual);
  const hayMas = abogados.length < total;

  return (
    <section id="listado-abogados" className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">
            Abogados suscriptos a la red PROBONO
          </h2>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${total} abogado${total === 1 ? "" : "s"} aprobado${total === 1 ? "" : "s"} en toda la red.`
              : "Todavía no hay abogados aprobados publicados."}
          </p>
        </div>
      </div>

      {abogados.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Todavía no hay abogados aprobados para mostrar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Slot para insertar (via portal) la tarjeta optimista del abogado
              recién inscripto, apenas envía el formulario de arriba. */}
          <div id="listado-optimista-slot" className="contents" />
          {abogados.map((abogado) => (
            <TarjetaAbogado
              key={abogado.id}
              id={`abogado-${abogado.id}`}
              nombre={abogado.nombre_completo}
              provincia={abogado.provincia}
              especialidades={abogado.especialidades}
              fechaAlta={abogado.fecha_alta}
            />
          ))}
        </div>
      )}

      {hayMas && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            render={
              <Link
                href={`?pagina=${paginaActual + 1}#listado-abogados`}
                scroll={false}
              />
            }
          >
            Cargar más abogados
          </Button>
        </div>
      )}
    </section>
  );
}
