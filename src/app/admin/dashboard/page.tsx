import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Clock, Scale, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DashboardCharts } from "@/components/admin/dashboard-charts";

export const metadata: Metadata = { title: "Dashboard — Admin" };

async function getKpis() {
  const supabase = await createClient();

  const [
    { count: abogadosPendientes },
    { count: abogadosAprobados },
    { count: solicitudesNuevas },
    { count: solicitudesEnCurso },
    { data: abogadosProvincia },
    { data: especialidadesData },
  ] = await Promise.all([
    supabase.from("abogados").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("abogados").select("id", { count: "exact", head: true }).eq("estado", "aprobado"),
    supabase.from("solicitudes").select("id", { count: "exact", head: true }).eq("estado", "nueva"),
    supabase.from("solicitudes").select("id", { count: "exact", head: true }).eq("estado", "en_curso"),
    supabase.from("abogados").select("provincia").eq("estado", "aprobado"),
    supabase
      .from("abogado_especialidades")
      .select("especialidades(nombre), abogados!inner(estado)")
      .eq("abogados.estado", "aprobado"),
  ]);

  const porProvinciaMap = new Map<string, number>();
  for (const a of abogadosProvincia ?? []) {
    porProvinciaMap.set(a.provincia, (porProvinciaMap.get(a.provincia) ?? 0) + 1);
  }
  const porProvincia = Array.from(porProvinciaMap, ([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const porEspecialidadMap = new Map<string, number>();
  for (const e of especialidadesData ?? []) {
    const nombre = (e as { especialidades: { nombre: string } | null }).especialidades?.nombre;
    if (!nombre) continue;
    porEspecialidadMap.set(nombre, (porEspecialidadMap.get(nombre) ?? 0) + 1);
  }
  const porEspecialidad = Array.from(porEspecialidadMap, ([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return {
    abogadosPendientes: abogadosPendientes ?? 0,
    abogadosAprobados: abogadosAprobados ?? 0,
    solicitudesNuevas: solicitudesNuevas ?? 0,
    solicitudesEnCurso: solicitudesEnCurso ?? 0,
    porProvincia,
    porEspecialidad,
  };
}

export default async function AdminDashboardPage() {
  const kpis = await getKpis();

  const tarjetas = [
    {
      titulo: "Abogados pendientes",
      valor: kpis.abogadosPendientes,
      icon: Clock,
      href: "/admin/abogados?estado=pendiente",
      borde: "border-l-amber-500",
      icono: "bg-amber-500/15 text-amber-600",
    },
    {
      titulo: "Abogados aprobados",
      valor: kpis.abogadosAprobados,
      icon: UserCheck,
      href: "/admin/abogados?estado=aprobado",
      borde: "border-l-emerald-500",
      icono: "bg-emerald-500/15 text-emerald-600",
    },
    {
      titulo: "Solicitudes nuevas",
      valor: kpis.solicitudesNuevas,
      icon: ClipboardList,
      href: "/admin/solicitudes?estado=nueva",
      borde: "border-l-blue-500",
      icono: "bg-blue-500/15 text-blue-600",
    },
    {
      titulo: "Solicitudes en curso",
      valor: kpis.solicitudesEnCurso,
      icon: Scale,
      href: "/admin/solicitudes?estado=en_curso",
      borde: "border-l-primary",
      icono: "bg-primary/15 text-primary",
    },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Panorama general de la red PROBONO.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.titulo} href={t.href} className="block">
            <Card className={`border-l-4 transition-shadow hover:shadow-md ${t.borde}`}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.titulo}
                </CardTitle>
                <span className={`flex size-8 items-center justify-center rounded-full ${t.icono}`}>
                  <t.icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-semibold">{t.valor}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DashboardCharts porProvincia={kpis.porProvincia} porEspecialidad={kpis.porEspecialidad} />
    </div>
  );
}
