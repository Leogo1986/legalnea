import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";
import { ADMIN_LINKS } from "@/components/layout/nav-links";
import { obtenerNotificacionesAdmin } from "@/lib/data/notificaciones-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { perfil } = await requireRole("admin");
  const collapsed = (await cookies()).get("sidebar_collapsed")?.value === "1";
  const notificaciones = await obtenerNotificacionesAdmin();

  return (
    <AppShell
      rol="admin"
      rolLabel="Admin"
      nombre={perfil.nombre_completo}
      links={ADMIN_LINKS}
      defaultCollapsed={collapsed}
      notificaciones={notificaciones}
    >
      {children}
    </AppShell>
  );
}
