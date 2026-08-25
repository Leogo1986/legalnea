import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { obtenerClienteDeUsuario } from "@/lib/data/solicitudes-cliente";
import { SolicitudCliente } from "@/components/cliente/solicitud-cliente";

export const metadata: Metadata = { title: "Solicitud — Legal Nea Soft" };

export default async function SolicitudClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole("cliente");
  const cliente = await obtenerClienteDeUsuario(user.id);

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">No encontramos tus datos.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes")
    .select(
      "id, motivo_consulta, estado, created_at, abogados(nombre_completo), solicitud_adjuntos(id, nombre_archivo, ruta_storage), solicitud_eventos(id, etapa, nota, autor_rol, created_at)"
    )
    .eq("id", id)
    .eq("cliente_id", cliente.id)
    .maybeSingle();

  if (!data) notFound();

  const abogado = data.abogados as unknown as { nombre_completo: string } | null;

  const solicitud = {
    id: data.id,
    motivo_consulta: data.motivo_consulta,
    estado: data.estado,
    created_at: data.created_at,
    abogadoNombre: abogado?.nombre_completo ?? null,
    adjuntos: (Array.isArray(data.solicitud_adjuntos) ? data.solicitud_adjuntos : []).map((a) => ({
      id: a.id,
      nombre: a.nombre_archivo,
      ruta: a.ruta_storage,
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

  return (
    <div className="grid gap-4">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/cliente/solicitudes" />}>
        <ArrowLeft className="size-4" />
        Volver a mis solicitudes
      </Button>
      <SolicitudCliente solicitud={solicitud} />
    </div>
  );
}
