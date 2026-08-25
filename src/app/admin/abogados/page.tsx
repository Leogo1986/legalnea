import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TablaAbogados, type AbogadoAdmin } from "@/components/admin/tabla-abogados";
import type { EstadoAbogado } from "@/types/database";

export const metadata: Metadata = { title: "Abogados — Admin" };

const ESTADOS_VALIDOS: EstadoAbogado[] = ["pendiente", "aprobado", "rechazado", "inactivo"];

export default async function AdminAbogadosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const estadoFiltro = ESTADOS_VALIDOS.includes(estado as EstadoAbogado)
    ? (estado as EstadoAbogado)
    : null;

  const supabase = await createClient();
  let query = supabase
    .from("abogados")
    .select(
      "id, nombre_completo, email, telefono, provincia, localidad, estado, fecha_alta, motivo_rechazo, abogado_especialidades(especialidades(nombre))"
    )
    .order("fecha_alta", { ascending: false });

  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data } = await query;

  const abogados: AbogadoAdmin[] = (data ?? []).map((a) => ({
    id: a.id,
    nombre_completo: a.nombre_completo,
    email: a.email,
    telefono: a.telefono,
    provincia: a.provincia,
    localidad: a.localidad,
    estado: a.estado,
    fecha_alta: a.fecha_alta,
    motivo_rechazo: a.motivo_rechazo,
    especialidades: Array.isArray(a.abogado_especialidades)
      ? a.abogado_especialidades
          .map((ae) =>
            ae && typeof ae === "object" && "especialidades" in ae
              ? (ae as { especialidades: { nombre: string } | null }).especialidades?.nombre
              : undefined
          )
          .filter((n): n is string => Boolean(n))
      : [],
  }));

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Abogados</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná las solicitudes de alta de la red PROBONO.
        </p>
      </div>
      <TablaAbogados abogados={abogados} estadoFiltro={estadoFiltro} />
    </div>
  );
}
