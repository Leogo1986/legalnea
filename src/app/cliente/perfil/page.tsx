import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { PerfilClienteForm } from "@/components/cliente/perfil-cliente-form";
import { CambiarPasswordForm } from "@/components/shared/cambiar-password-form";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi perfil — Legal Nea Soft" };

export default async function PerfilClientePage() {
  const { user, perfil } = await requireRole("cliente");
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("nombre_completo, email, telefono, calle, altura, piso, dpto, provincia, localidad")
    .eq("user_id", user.id)
    .single();

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">No encontramos tu perfil.</p>;
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Revisá y actualizá tus datos de contacto.</p>
      </div>

      <Card>
        <CardContent className="py-4">
          <AvatarUpload userId={user.id} nombreCompleto={cliente.nombre_completo} avatarUrlInicial={perfil.avatar_url} />
        </CardContent>
      </Card>

      <PerfilClienteForm cliente={cliente} />
      <CambiarPasswordForm />
    </div>
  );
}
