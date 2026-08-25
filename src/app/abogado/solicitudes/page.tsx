import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ListaSolicitudesAbogado } from "@/components/abogado/lista-solicitudes-abogado";

export const metadata: Metadata = { title: "Mis solicitudes — Abogado" };

export default async function SolicitudesAbogadoPage() {
  const { user } = await requireRole("abogado");
  const supabase = await createClient();

  const { data: abogado } = await supabase
    .from("abogados")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!abogado) {
    return <p className="text-sm text-muted-foreground">No encontramos tu perfil.</p>;
  }

  const { data } = await supabase
    .from("solicitudes")
    .select(
      "id, motivo_consulta, estado, prioridad, created_at, clientes(nombre_completo, email, telefono, provincia), solicitud_adjuntos(id, nombre_archivo, ruta_storage)"
    )
    .eq("abogado_asignado_id", abogado.id)
    .order("created_at", { ascending: false });

  const solicitudes = (data ?? []).map((s) => {
    const cliente = s.clientes as unknown as {
      nombre_completo: string;
      email: string;
      telefono: string;
      provincia: string;
    } | null;
    return {
      id: s.id,
      motivo_consulta: s.motivo_consulta,
      estado: s.estado,
      prioridad: s.prioridad,
      created_at: s.created_at,
      cliente_nombre: cliente?.nombre_completo ?? "—",
      cliente_email: cliente?.email ?? "—",
      cliente_telefono: cliente?.telefono ?? "—",
      cliente_provincia: cliente?.provincia ?? "—",
      adjuntos: (Array.isArray(s.solicitud_adjuntos) ? s.solicitud_adjuntos : []).map((a) => ({
        id: a.id,
        nombre: a.nombre_archivo,
        ruta: a.ruta_storage,
      })),
    };
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Mis solicitudes asignadas</h1>
        <p className="text-sm text-muted-foreground">
          Casos de la red PROBONO que te asignó el equipo de Legal Nea.
        </p>
      </div>
      <ListaSolicitudesAbogado solicitudes={solicitudes} />
    </div>
  );
}
