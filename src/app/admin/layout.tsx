import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";
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
      defaultCollapsed={collapsed}
      notificaciones={notificaciones}
    >
      {children}
    </AppShell>
  );
}
