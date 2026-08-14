import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { perfil } = await requireRole("admin");

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav nombre={perfil.nombre_completo} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
