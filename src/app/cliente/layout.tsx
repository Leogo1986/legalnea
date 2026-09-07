import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";
import { CLIENTE_LINKS } from "@/components/layout/nav-links";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const { perfil } = await requireRole("cliente");
  const collapsed = (await cookies()).get("sidebar_collapsed")?.value === "1";

  return (
    <AppShell
      rol="cliente"
      rolLabel="Cliente"
      nombre={perfil.nombre_completo}
      links={CLIENTE_LINKS}
      defaultCollapsed={collapsed}
    >
      {children}
    </AppShell>
  );
}
