import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";
import { ABOGADO_LINKS } from "@/components/layout/nav-links";

export default async function AbogadoLayout({ children }: { children: ReactNode }) {
  const { perfil } = await requireRole("abogado");
  const collapsed = (await cookies()).get("sidebar_collapsed")?.value === "1";

  return (
    <AppShell
      rol="abogado"
      rolLabel="Abogado"
      nombre={perfil.nombre_completo}
      links={ABOGADO_LINKS}
      defaultCollapsed={collapsed}
    >
      {children}
    </AppShell>
  );
}
