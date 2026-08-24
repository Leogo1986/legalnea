import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { DetalleCasoAbogado } from "@/components/abogado/detalle-caso-abogado";

export const metadata: Metadata = { title: "Caso — Abogado" };

export default async function CasoAbogadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole("abogado");
  const supabase = await createClient();

  const { data: abogado } = await supabase
    .from("abogados")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!abogado) notFound();

  const { data } = await supabase
    .from("solicitudes")
    .select(
      "id, motivo_consulta, descripcion, estado, prioridad, created_at, clientes(nombre_completo, email, telefono, direccion, provincia, localidad), solicitud_adjuntos(id, nombre_archivo, ruta_storage), mensajes(id, contenido, autor_rol, created_at), solicitud_eventos(id, etapa, nota, autor_rol, created_at)"
    )
    .eq("id", id)
    .eq("abogado_asignado_id", abogado.id)
    .maybeSingle();

  if (!data) notFound();

  const cliente = data.clientes as unknown as {
    nombre_completo: string;
    email: string;
    telefono: string;
    direccion: string | null;
    provincia: string;
    localidad: string;
  } | null;

  const solicitud = {
    id: data.id,
    motivo_consulta: data.motivo_consulta,
    descripcion: data.descripcion,
    estado: data.estado,
    prioridad: data.prioridad,
    created_at: data.created_at,
    cliente: cliente ?? {
      nombre_completo: "—",
      email: "—",
      telefono: "—",
      direccion: null,
      provincia: "—",
      localidad: "—",
    },
    adjuntos: (Array.isArray(data.solicitud_adjuntos) ? data.solicitud_adjuntos : []).map((a) => ({
      id: a.id,
      nombre: a.nombre_archivo,
      ruta: a.ruta_storage,
    })),
    mensajes: (Array.isArray(data.mensajes) ? data.mensajes : [])
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m) => ({
        id: m.id,
        contenido: m.contenido,
        autorRol: m.autor_rol,
        createdAt: m.created_at,
      })),
    eventos: (Array.isArray(data.solicitud_eventos) ? data.solicitud_eventos : [])
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((e) => ({
        id: e.id,
        etapa: e.etapa,
        nota: e.nota,
        autorRol: e.autor_rol,
        createdAt: e.created_at,
      })),
  };

  return <DetalleCasoAbogado solicitud={solicitud} />;
}
