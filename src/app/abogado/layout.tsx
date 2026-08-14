import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { AbogadoNav } from "@/components/abogado/abogado-nav";

export default async function AbogadoLayout({ children }: { children: ReactNode }) {
  const { perfil } = await requireRole("abogado");

  return (
    <div className="flex min-h-full flex-col">
      <AbogadoNav nombre={perfil.nombre_completo} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
