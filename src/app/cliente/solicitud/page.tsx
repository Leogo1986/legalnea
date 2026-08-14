import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { SolicitudCliente } from "@/components/cliente/solicitud-cliente";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi solicitud — Legal Nea Soft" };

export default async function SolicitudClientePage() {
  const { user } = await requireRole("cliente");
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">No encontramos tus datos.</p>;
  }

  const { data } = await supabase
    .from("solicitudes")
    .select(
      "id, motivo_consulta, estado, created_at, abogados(nombre_completo), solicitud_adjuntos(id, nombre_archivo, ruta_storage), mensajes(id, contenido, autor_rol, created_at)"
    )
    .eq("cliente_id", cliente.id)
    .order("created_at", { ascending: false });

  const solicitudes = (data ?? []).map((s) => {
    const abogado = s.abogados as unknown as { nombre_completo: string } | null;
    return {
      id: s.id,
      motivo_consulta: s.motivo_consulta,
      estado: s.estado,
      created_at: s.created_at,
      abogadoNombre: abogado?.nombre_completo ?? null,
      adjuntos: (Array.isArray(s.solicitud_adjuntos) ? s.solicitud_adjuntos : []).map((a) => ({
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

  if (solicitudes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Todavía no registramos ninguna solicitud a tu nombre.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Mi solicitud</h1>
        <p className="text-sm text-muted-foreground">
          Seguí el estado de tu pedido de asistencia jurídica gratuita.
        </p>
      </div>
      {solicitudes.map((s) => (
        <SolicitudCliente key={s.id} solicitud={s} />
      ))}
    </div>
  );
}
