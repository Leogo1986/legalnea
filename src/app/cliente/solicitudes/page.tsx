import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { obtenerClienteDeUsuario, obtenerSolicitudesCliente } from "@/lib/data/solicitudes-cliente";
import { TarjetaSolicitudCliente } from "@/components/cliente/tarjeta-solicitud-cliente";

export const metadata: Metadata = { title: "Mis solicitudes — Legal Nea Soft" };

export default async function SolicitudesClientePage() {
  const { user } = await requireRole("cliente");
  const cliente = await obtenerClienteDeUsuario(user.id);

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">No encontramos tus datos.</p>;
  }

  const solicitudes = await obtenerSolicitudesCliente(cliente.id);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Mis solicitudes</h1>
        <p className="text-sm text-muted-foreground">
          Todos tus pedidos de asistencia jurídica gratuita, del más reciente al más antiguo.
        </p>
      </div>

      {solicitudes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Todavía no registramos ninguna solicitud a tu nombre.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {solicitudes.map((s) => (
            <TarjetaSolicitudCliente key={s.id} solicitud={s} />
          ))}
        </div>
      )}
    </div>
  );
}
