import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Scale, ScrollText, UserRound, Users } from "lucide-react";

export type NavLink = { href: string; label: string; icon: LucideIcon };

// Mismos links que antes vivían hardcodeados dentro de cada *-nav.tsx
// (admin-nav.tsx / abogado-nav.tsx / cliente-nav.tsx, ahora eliminados —
// su render se centralizó en components/layout/app-shell.tsx).
export const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/abogados", label: "Abogados", icon: Scale },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: ScrollText },
];

export const ABOGADO_LINKS: NavLink[] = [
  { href: "/abogado/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/abogado/solicitudes", label: "Solicitudes", icon: ScrollText },
  { href: "/abogado/perfil", label: "Mi perfil", icon: UserRound },
];

export const CLIENTE_LINKS: NavLink[] = [
  { href: "/cliente/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cliente/solicitudes", label: "Mis Solicitudes", icon: ScrollText },
  { href: "/cliente/perfil", label: "Mi perfil", icon: UserRound },
];

export const ROL_ICON: Record<"admin" | "abogado" | "cliente", LucideIcon> = {
  admin: Users,
  abogado: Scale,
  cliente: Scale,
};
