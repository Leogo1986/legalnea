import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TablaAbogados, type AbogadoAdmin } from "@/components/admin/tabla-abogados";
import { getSiteUrl } from "@/lib/site-url";
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
      "id, nombre_completo, email, telefono, dni, provincia, localidad, calle, altura, piso, dpto, codigo_postal, matricula_federal, matricula_provincial, anios_experiencia, motivacion, declaracion_jurada_pdf_url, estado, fecha_alta, motivo_rechazo, abogado_especialidades(especialidades(nombre))"
    )
    .order("fecha_alta", { ascending: false });

  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data } = await query;

  const abogados: AbogadoAdmin[] = (data ?? []).map((a) => ({
    id: a.id,
    nombre_completo: a.nombre_completo,
    email: a.email,
    telefono: a.telefono,
    dni: a.dni,
    provincia: a.provincia,
    localidad: a.localidad,
    calle: a.calle,
    altura: a.altura,
    piso: a.piso,
    dpto: a.dpto,
    codigo_postal: a.codigo_postal,
    matricula_federal: a.matricula_federal,
    matricula_provincial: a.matricula_provincial,
    anios_experiencia: a.anios_experiencia,
    motivacion: a.motivacion,
    declaracion_jurada_pdf_url: a.declaracion_jurada_pdf_url,
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
      <TablaAbogados abogados={abogados} estadoFiltro={estadoFiltro} siteUrl={getSiteUrl()} />
    </div>
  );
}
