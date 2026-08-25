"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Scale, ScrollText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

const LINKS = [
  { href: "/cliente/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cliente/solicitudes", label: "Mis Solicitudes", icon: ScrollText },
  { href: "/cliente/perfil", label: "Mi perfil", icon: UserRound },
];

export function ClienteNav({ nombre }: { nombre: string }) {
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
      <div className="mx-auto flex h-18 max-w-4xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2.5 font-heading text-xl font-bold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="size-5" />
            </span>
            <span className="hidden sm:inline">{SITE_NAME}</span>
          </span>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const activo = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={activo ? "secondary" : "ghost"}
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
          <span className="hidden text-sm text-muted-foreground sm:inline">{nombre}</span>
          <Button variant="ghost" onClick={salir}>
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
