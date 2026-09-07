import type { Metadata } from "next";
import { ClipboardList, Clock, Scale, UserCheck } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
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
      color: "amber",
    },
    {
      titulo: "Abogados aprobados",
      valor: kpis.abogadosAprobados,
      icon: UserCheck,
      href: "/admin/abogados?estado=aprobado",
      color: "emerald",
    },
    {
      titulo: "Solicitudes nuevas",
      valor: kpis.solicitudesNuevas,
      icon: ClipboardList,
      href: "/admin/solicitudes?estado=nueva",
      color: "blue",
    },
    {
      titulo: "Solicitudes en curso",
      valor: kpis.solicitudesEnCurso,
      icon: Scale,
      href: "/admin/solicitudes?estado=en_curso",
      color: "primary",
    },
  ] as const;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Panorama general de la red PROBONO.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <StatCard key={t.titulo} title={t.titulo} value={t.valor} icon={t.icon} color={t.color} href={t.href} />
        ))}
      </div>

      <DashboardCharts porProvincia={kpis.porProvincia} porEspecialidad={kpis.porEspecialidad} />
    </div>
  );
}
