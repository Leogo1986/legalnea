import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { ClienteNav } from "@/components/cliente/cliente-nav";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const { perfil } = await requireRole("cliente");

  return (
    <div className="flex min-h-full flex-col">
      <ClienteNav nombre={perfil.nombre_completo} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
