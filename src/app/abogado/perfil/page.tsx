import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { PerfilAbogadoForm } from "@/components/abogado/perfil-abogado-form";
import { CambiarPasswordAbogadoForm } from "@/components/abogado/cambiar-password-abogado-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi perfil — Abogado" };

const MENSAJE_ESTADO: Record<string, string> = {
  pendiente: "Tu inscripción está en revisión. Te avisamos por email en cuanto haya novedades.",
  aprobado: "Tu cuenta está aprobada y activa. ¡Gracias por sumarte a la red PROBONO!",
  rechazado: "Tu inscripción no fue aprobada en esta oportunidad.",
  inactivo: "Tu cuenta está suspendida. Contactá al administrador si creés que es un error.",
};

export default async function PerfilAbogadoPage() {
  const { user } = await requireRole("abogado");
  const supabase = await createClient();

  const { data: abogado } = await supabase
    .from("abogados")
    .select(
      "nombre_completo, email, telefono, calle, altura, piso, dpto, provincia, localidad, codigo_postal, matricula_federal, matricula_provincial, estado, motivo_rechazo"
    )
    .eq("user_id", user.id)
    .single();

  if (!abogado) {
    return <p className="text-sm text-muted-foreground">No encontramos tu perfil.</p>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="py-4 text-sm">
          <p className="font-medium">Estado: {abogado.estado}</p>
          <p className="text-muted-foreground">{MENSAJE_ESTADO[abogado.estado]}</p>
          {abogado.estado === "rechazado" && abogado.motivo_rechazo && (
            <p className="mt-1 text-muted-foreground">Motivo: {abogado.motivo_rechazo}</p>
          )}
        </CardContent>
      </Card>

      <PerfilAbogadoForm abogado={abogado} />
      <CambiarPasswordAbogadoForm />
    </div>
  );
}
