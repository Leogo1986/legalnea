import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-role";
import { PerfilAdminForm } from "@/components/admin/perfil-admin-form";
import { CambiarPasswordForm } from "@/components/shared/cambiar-password-form";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi perfil — Admin" };

export default async function PerfilAdminPage() {
  const { user, perfil } = await requireRole("admin");

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Tus datos personales y acceso.</p>
      </div>

      <Card>
        <CardContent className="py-4">
          <AvatarUpload userId={user.id} nombreCompleto={perfil.nombre_completo} avatarUrlInicial={perfil.avatar_url} />
        </CardContent>
      </Card>

      <PerfilAdminForm admin={{ nombre_completo: perfil.nombre_completo, email: perfil.email, telefono: perfil.telefono }} />
      <CambiarPasswordForm />
    </div>
  );
}
