"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Scale, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebarCollapsed,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";
import { marcarNotificacionesLeidas } from "@/app/admin/actions";
import { iniciales } from "@/lib/estilos-estado";
import { ABOGADO_LINKS, ADMIN_LINKS, CLIENTE_LINKS, type NavLink } from "@/components/layout/nav-links";
import type { NotificacionAdmin } from "@/types/database";

type Rol = "admin" | "abogado" | "cliente";

function ShellSidebarHeader({ rolLabel }: { rolLabel: string }) {
  const collapsed = useSidebarCollapsed();
  return (
    <SidebarHeader className={collapsed ? "justify-center px-0" : undefined}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Scale className="size-4.5" />
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-heading text-base font-bold text-sidebar-foreground">{SITE_NAME}</span>
          <span className="truncate text-xs text-sidebar-foreground/60">{rolLabel}</span>
        </span>
      )}
    </SidebarHeader>
  );
}

function ShellSidebarFooter({ nombre, onSalir }: { nombre: string; onSalir: () => void }) {
  const collapsed = useSidebarCollapsed();

  if (collapsed) {
    return (
      <SidebarFooter className="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onSalir}
                aria-label="Salir"
                className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              />
            }
          >
            <LogOut className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Salir</TooltipContent>
        </Tooltip>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter>
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
            {iniciales(nombre)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground">{nombre}</span>
        <button
          type="button"
          onClick={onSalir}
          aria-label="Salir"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </SidebarFooter>
  );
}

function formatearFechaNotificacion(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(fecha));
}

// Los links (con sus íconos de lucide-react) se resuelven acá adentro, en
// componente cliente, a partir del `rol` — no como prop desde el layout
// (Server Component): un ícono es una referencia a función/componente, y
// pasar eso como prop server→cliente rompe la serialización del RSC payload
// (funciona en `npm run build` porque las rutas son dinámicas y no se
// prerrenderizan, pero explota en producción en cada request real).
const LINKS_POR_ROL: Record<Rol, NavLink[]> = {
  admin: ADMIN_LINKS,
  abogado: ABOGADO_LINKS,
  cliente: CLIENTE_LINKS,
};

export function AppShell({
  rol,
  rolLabel,
  nombre,
  defaultCollapsed,
  notificaciones,
  children,
}: {
  rol: Rol;
  rolLabel: string;
  nombre: string;
  defaultCollapsed: boolean;
  notificaciones?: NotificacionAdmin[];
  children: React.ReactNode;
}) {
  const links = LINKS_POR_ROL[rol];
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifs, setNotifs] = React.useState(notificaciones ?? []);
  const noLeidas = notifs.filter((n) => !n.leida).length;

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function alAbrirNotificaciones(open: boolean) {
    if (!open || noLeidas === 0) return;
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    void marcarNotificacionesLeidas();
  }

  return (
    <SidebarProvider defaultCollapsed={defaultCollapsed}>
      <Sidebar>
        <ShellSidebarHeader rolLabel={rolLabel} />
        <SidebarContent>
          <SidebarMenu>
            {links.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  active={pathname.startsWith(link.href)}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <ShellSidebarFooter nombre={nombre} onSalir={salir} />
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-5">
          <div className="flex items-center gap-1">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {rol === "admin" && (
              <DropdownMenu onOpenChange={alAbrirNotificaciones}>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
                  <Bell className="size-4.5" />
                  {noLeidas > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[0.65rem]">
                      {noLeidas}
                    </Badge>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifs.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">Sin notificaciones.</p>
                  ) : (
                    notifs.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm",
                          !n.leida && "bg-accent/50"
                        )}
                      >
                        <span className="font-medium">{n.titulo}</span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{n.mensaje}</span>
                        <span className="text-[0.7rem] text-muted-foreground/70">
                          {formatearFechaNotificacion(n.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-1.5" />}>
                <Avatar size="sm">
                  <AvatarFallback>{iniciales(nombre)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{nombre}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{rolLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {rol !== "admin" && (
                  <DropdownMenuItem render={<Link href={`/${rol}/perfil`} />}>
                    <UserRound />
                    Mi perfil
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onClick={salir}>
                  <LogOut />
                  Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Links de navegación de {rolLabel}</SheetDescription>
          <div className="flex items-center gap-2.5 border-b border-sidebar-border pb-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Scale className="size-4.5" />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate font-heading text-base font-bold">{SITE_NAME}</span>
              <span className="truncate text-xs text-sidebar-foreground/60">{rolLabel}</span>
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {links.map((link) => (
              <SidebarMenuButton
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={pathname.startsWith(link.href)}
                forceExpanded
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
          <div className="flex items-center gap-2 border-t border-sidebar-border pt-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {iniciales(nombre)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{nombre}</span>
            <button
              type="button"
              onClick={salir}
              aria-label="Salir"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
