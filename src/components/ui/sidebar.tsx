"use client"

import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Sidebar de navegación reusable para las 3 áreas logueadas (admin/abogado/
// cliente). Siempre oscuro (ver globals.css: --sidebar* usa los valores de
// .dark en :root también — pedido explícito, no sigue el tema claro/oscuro
// del resto de la app). En desktop es un <aside> fijo que colapsa a solo
// íconos; en mobile no se renderiza — el nav mobile vive en un <Sheet>
// aparte (ver app-shell.tsx) reusando estos mismos sub-componentes.

type SidebarContextValue = { collapsed: boolean }

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
})

const COOKIE_NAME = "sidebar_collapsed"

function SidebarProvider({
  defaultCollapsed = false,
  children,
}: {
  defaultCollapsed?: boolean
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      document.cookie = `${COOKIE_NAME}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <SidebarToggleContext.Provider value={toggleCollapsed}>
        <TooltipProvider delay={150}>
          <div
            data-slot="sidebar-provider"
            className="flex min-h-svh w-full"
            style={
              {
                "--sidebar-width": collapsed ? "4.75rem" : "16rem",
              } as React.CSSProperties
            }
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarToggleContext.Provider>
    </SidebarContext.Provider>
  )
}

// Contexto del toggle, separado del de solo-lectura de arriba para que
// SidebarTrigger (topbar) y Sidebar/SidebarMenuButton (aside) puedan
// consumir cada uno solo lo que necesitan.
const SidebarToggleContext = React.createContext<() => void>(() => {})

function useSidebarCollapsed() {
  return React.useContext(SidebarContext).collapsed
}

function useSidebarToggle() {
  return React.useContext(SidebarToggleContext)
}

function Sidebar({ className, children, ...props }: React.ComponentProps<"aside">) {
  const collapsed = useSidebarCollapsed()
  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 z-30 hidden h-svh w-(--sidebar-width) shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function SidebarHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex-1 overflow-y-auto overflow-x-hidden px-3 py-4", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("border-t border-sidebar-border p-3", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn(className)} {...props} />
}

function SidebarMenuButton({
  href,
  icon: Icon,
  label,
  active,
  forceExpanded,
  className,
  onClick,
}: {
  href: string
  icon: LucideIcon
  label: string
  active?: boolean
  /** Fuerza el label visible aunque el sidebar esté colapsado — para usarlo dentro del Sheet mobile, que nunca colapsa. */
  forceExpanded?: boolean
  className?: string
  /** Ej: cerrar el Sheet mobile al navegar. */
  onClick?: () => void
}) {
  const collapsedCtx = useSidebarCollapsed()
  const collapsed = collapsedCtx && !forceExpanded

  const link = (
    <Link
      href={href}
      data-active={active}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-[0.9rem] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
        className
      )}
    >
      <Icon className="size-[1.15rem] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function SidebarTrigger({ className }: { className?: string }) {
  const toggle = useSidebarToggle()
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      onClick={toggle}
      className={cn(
        "hidden size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex",
        className
      )}
      aria-label="Colapsar/expandir menú"
    >
      <SidebarTriggerIcon />
    </button>
  )
}

function SidebarTriggerIcon() {
  const collapsed = useSidebarCollapsed()
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4.5 transition-transform duration-200", collapsed && "rotate-180")}
    >
      <path d="M11 19l-7-7 7-7" />
      <path d="M18 19l-7-7 7-7" />
    </svg>
  )
}

export {
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
}
