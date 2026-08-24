"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Scale, ScrollText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

const LINKS = [
  { href: "/abogado/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/abogado/solicitudes", label: "Solicitudes", icon: ScrollText },
  { href: "/abogado/perfil", label: "Mi perfil", icon: UserRound },
];

export function AbogadoNav({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-heading text-sm font-semibold">
            <Scale className="size-4 text-primary" />
            {SITE_NAME}
          </span>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const activo = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={activo ? "secondary" : "ghost"}
                  size="sm"
                  render={<Link href={link.href} />}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{nombre}</span>
          <Button variant="ghost" size="sm" onClick={salir}>
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
