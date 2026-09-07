import type { Metadata } from "next";
import { CheckCircle2, ClipboardList, Users, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { DashboardCasosChart } from "@/components/abogado/dashboard-casos-chart";
import type { EstadoSolicitud } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard — Abogado" };

const ESTADOS_NO_RESUELTOS: EstadoSolicitud[] = ["nueva", "en_revision", "asignada", "en_curso"];

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  asignada: "Asignada",
  en_curso: "En curso",
  resuelta: "Resuelta",
  derivada: "Derivada",
  cerrada: "Cerrada",
  anulada: "Anulada",
  rechazada: "Rechazada",
};

async function getKpis(abogadoId: string) {
  const supabase = await createClient();

  const [
    { count: totalCasos },
    { count: resueltos },
    { count: noResueltos },
    { count: anulados },
    { data: clientesData },
    { data: estadosData },
  ] = await Promise.all([
    supabase
      .from("solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("abogado_asignado_id", abogadoId),
    supabase
      .from("solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("abogado_asignado_id", abogadoId)
      .eq("estado", "resuelta"),
    supabase
      .from("solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("abogado_asignado_id", abogadoId)
      .in("estado", ESTADOS_NO_RESUELTOS),
    supabase
      .from("solicitudes")
      .select("id", { count: "exact", head: true })
      .eq("abogado_asignado_id", abogadoId)
      .eq("estado", "anulada"),
    supabase.from("solicitudes").select("cliente_id").eq("abogado_asignado_id", abogadoId),
    supabase.from("solicitudes").select("estado").eq("abogado_asignado_id", abogadoId),
  ]);

  const clientesUnicos = new Set((clientesData ?? []).map((s) => s.cliente_id)).size;

  const porEstadoMap = new Map<string, number>();
  for (const s of estadosData ?? []) {
    porEstadoMap.set(s.estado, (porEstadoMap.get(s.estado) ?? 0) + 1);
  }
  const porEstado = Array.from(porEstadoMap, ([estado, total]) => ({
    nombre: ESTADO_LABEL[estado as EstadoSolicitud] ?? estado,
    total,
  }));

  return {
    clientesUnicos,
    totalCasos: totalCasos ?? 0,
    resueltos: resueltos ?? 0,
    noResueltos: noResueltos ?? 0,
    anulados: anulados ?? 0,
    porEstado,
  };
}

export default async function DashboardAbogadoPage() {
  const { user } = await requireRole("abogado");
  const supabase = await createClient();

  const { data: abogado } = await supabase
    .from("abogados")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!abogado) {
    return <p className="text-sm text-muted-foreground">No encontramos tu perfil.</p>;
  }

  const kpis = await getKpis(abogado.id);

  const tarjetas = [
    { titulo: "Clientes asignados", valor: kpis.clientesUnicos, icon: Users, color: "primary" },
    { titulo: "Casos totales", valor: kpis.totalCasos, icon: ClipboardList, color: "blue" },
    { titulo: "Resueltos", valor: kpis.resueltos, icon: CheckCircle2, color: "emerald" },
    { titulo: "No resueltos", valor: kpis.noResueltos, icon: ClipboardList, color: "amber" },
    { titulo: "Anulados", valor: kpis.anulados, icon: XCircle, color: "destructive" },
  ] as const;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tus casos asignados.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <StatCard key={t.titulo} title={t.titulo} value={t.valor} icon={t.icon} color={t.color} />
        ))}
      </div>

      {kpis.totalCasos > 0 && <DashboardCasosChart porEstado={kpis.porEstado} />}
    </div>
  );
}
