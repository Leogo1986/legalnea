import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TablaSolicitudes, type SolicitudAdmin } from "@/components/admin/tabla-solicitudes";
import type { EstadoSolicitud } from "@/types/database";

export const metadata: Metadata = { title: "Solicitudes — Admin" };

const ESTADOS_VALIDOS: EstadoSolicitud[] = [
  "nueva",
  "en_revision",
  "asignada",
  "en_curso",
  "resuelta",
  "derivada",
  "cerrada",
];

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const estadoFiltro = ESTADOS_VALIDOS.includes(estado as EstadoSolicitud)
    ? (estado as EstadoSolicitud)
    : null;

  const supabase = await createClient();

  let query = supabase
    .from("solicitudes")
    .select(
      "id, motivo_consulta, estado, prioridad, created_at, abogado_asignado_id, clientes(nombre_completo, email, telefono, provincia), abogados(nombre_completo), solicitud_adjuntos(id, nombre_archivo, ruta_storage), mensajes(id, contenido, autor_rol, created_at)"
    )
    .order("created_at", { ascending: false });

  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const [{ data }, { data: abogadosAprobados }] = await Promise.all([
    query,
    supabase
      .from("abogados")
      .select("id, nombre_completo, provincia")
      .eq("estado", "aprobado")
      .order("nombre_completo"),
  ]);

  const solicitudes: SolicitudAdmin[] = (data ?? []).map((s) => {
    const cliente = s.clientes as unknown as {
      nombre_completo: string;
      email: string;
      telefono: string;
      provincia: string;
    } | null;
    const abogado = s.abogados as unknown as { nombre_completo: string } | null;
    const adjuntos = Array.isArray(s.solicitud_adjuntos) ? s.solicitud_adjuntos : [];

    return {
      id: s.id,
      motivo_consulta: s.motivo_consulta,
      estado: s.estado,
      prioridad: s.prioridad,
      created_at: s.created_at,
      abogado_asignado_id: s.abogado_asignado_id,
      abogado_asignado_nombre: abogado?.nombre_completo ?? null,
      cliente_nombre: cliente?.nombre_completo ?? "—",
      cliente_email: cliente?.email ?? "—",
      cliente_telefono: cliente?.telefono ?? "—",
      cliente_provincia: cliente?.provincia ?? "—",
      adjuntos: adjuntos.map((a) => ({
        id: a.id,
        nombre: a.nombre_archivo,
        ruta: a.ruta_storage,
      })),
      mensajes: (Array.isArray(s.mensajes) ? s.mensajes : [])
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m) => ({
          id: m.id,
          contenido: m.contenido,
          autorRol: m.autor_rol,
          createdAt: m.created_at,
        })),
    };
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Solicitudes</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná las solicitudes de asistencia jurídica gratuita.
        </p>
      </div>
      <TablaSolicitudes
        solicitudes={solicitudes}
        abogadosAprobados={abogadosAprobados ?? []}
        estadoFiltro={estadoFiltro}
      />
    </div>
  );
}
