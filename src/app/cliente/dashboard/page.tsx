import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import {
  calcularKpisCliente,
  obtenerClienteDeUsuario,
  obtenerSolicitudesCliente,
} from "@/lib/data/solicitudes-cliente";
import { TarjetaSolicitudCliente } from "@/components/cliente/tarjeta-solicitud-cliente";

export const metadata: Metadata = { title: "Dashboard — Legal Nea Soft" };

export default async function DashboardClientePage() {
  const { user } = await requireRole("cliente");
  const cliente = await obtenerClienteDeUsuario(user.id);

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">No encontramos tus datos.</p>;
  }

  const solicitudes = await obtenerSolicitudesCliente(cliente.id);
  const kpis = calcularKpisCliente(solicitudes);
  const recientes = solicitudes.slice(0, 3);

  const tarjetas = [
    {
      titulo: "Solicitudes totales",
      valor: kpis.total,
      icon: ClipboardList,
      borde: "border-l-primary",
      icono: "bg-primary/15 text-primary",
    },
    {
      titulo: "En curso",
      valor: kpis.enCurso,
      icon: Clock3,
      borde: "border-l-amber-500",
      icono: "bg-amber-500/15 text-amber-600",
    },
    {
      titulo: "Resueltas",
      valor: kpis.resueltas,
      icon: CheckCircle2,
      borde: "border-l-emerald-500",
      icono: "bg-emerald-500/15 text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu asistencia legal gratuita.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Solicitudes recientes</h2>
          {solicitudes.length > 0 && (
            <Button variant="ghost" size="sm" render={<Link href="/cliente/solicitudes" />}>
              Ver todas
            </Button>
          )}
        </div>

        {recientes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Todavía no registramos ninguna solicitud a tu nombre.
            </CardContent>
          </Card>
        ) : (
          recientes.map((s) => <TarjetaSolicitudCliente key={s.id} solicitud={s} />)
        )}
      </div>
    </div>
  );
}
