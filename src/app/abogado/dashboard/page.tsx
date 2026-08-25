import type { Metadata } from "next";
import { CheckCircle2, ClipboardList, Users, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    {
      titulo: "Clientes asignados",
      valor: kpis.clientesUnicos,
      icon: Users,
      borde: "border-l-primary",
      icono: "bg-primary/15 text-primary",
    },
    {
      titulo: "Casos totales",
      valor: kpis.totalCasos,
      icon: ClipboardList,
      borde: "border-l-blue-500",
      icono: "bg-blue-500/15 text-blue-600",
    },
    {
      titulo: "Resueltos",
      valor: kpis.resueltos,
      icon: CheckCircle2,
      borde: "border-l-emerald-500",
      icono: "bg-emerald-500/15 text-emerald-600",
    },
    {
      titulo: "No resueltos",
      valor: kpis.noResueltos,
      icon: ClipboardList,
      borde: "border-l-amber-500",
      icono: "bg-amber-500/15 text-amber-600",
    },
    {
      titulo: "Anulados",
      valor: kpis.anulados,
      icon: XCircle,
      borde: "border-l-destructive",
      icono: "bg-destructive/15 text-destructive",
    },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tus casos asignados.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <Card key={t.titulo} className={`border-l-4 ${t.borde}`}>
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
        ))}
      </div>

      {kpis.totalCasos > 0 && <DashboardCasosChart porEstado={kpis.porEstado} />}
    </div>
  );
}
