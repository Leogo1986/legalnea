import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Tarjeta de KPI reusable — antes vivía duplicada (mismo markup, mismas
// clases) en admin/abogado/cliente dashboard/page.tsx. `color` resuelve al
// mismo par borde+ícono que ya usaban esas 3 pantallas (border-l-{color} +
// bg-{color}/15 text-{color}); `href` es opcional (solo el dashboard de
// admin linkea sus KPIs a la lista filtrada).
const COLOR_CLASSES = {
  primary: { borde: "border-l-primary", icono: "bg-primary/15 text-primary" },
  blue: { borde: "border-l-blue-500", icono: "bg-blue-500/15 text-blue-600" },
  emerald: { borde: "border-l-emerald-500", icono: "bg-emerald-500/15 text-emerald-600" },
  amber: { borde: "border-l-amber-500", icono: "bg-amber-500/15 text-amber-600" },
  destructive: { borde: "border-l-destructive", icono: "bg-destructive/15 text-destructive" },
  violet: { borde: "border-l-violet-500", icono: "bg-violet-500/15 text-violet-600" },
} as const

export type StatCardColor = keyof typeof COLOR_CLASSES

function StatCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  href,
  className,
}: {
  title: string
  value: number | string
  icon: LucideIcon
  color?: StatCardColor
  href?: string
  className?: string
}) {
  const { borde, icono } = COLOR_CLASSES[color]

  const card = (
    <Card className={cn("border-l-4 transition-shadow", href && "hover:shadow-md", borde, className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={cn("flex size-8 items-center justify-center rounded-full", icono)}>
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )

  if (!href) return card
  return (
    <Link href={href} className="block">
      {card}
    </Link>
  )
}

export { StatCard }
