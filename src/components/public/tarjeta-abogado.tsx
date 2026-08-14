import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function formatearFechaAlta(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));
}

export function TarjetaAbogado({
  id,
  nombre,
  provincia,
  especialidades,
  fechaAlta,
  pendiente = false,
  destacar = false,
  className,
}: {
  id?: string;
  nombre: string;
  provincia: string;
  especialidades: string[];
  fechaAlta: string;
  pendiente?: boolean;
  destacar?: boolean;
  className?: string;
}) {
  return (
    <Card
      id={id}
      data-abogado-id={id}
      className={cn(
        destacar && "animate-tarjeta-destacada ring-2 ring-primary",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{nombre}</CardTitle>
          {pendiente && (
            <Badge variant="outline" className="shrink-0 text-amber-600">
              Pendiente de aprobación
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {provincia}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {especialidades.length > 0 ? (
            especialidades.map((esp) => (
              <Badge key={esp} variant="secondary">
                {esp}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              Sin especialidades cargadas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Alta: {formatearFechaAlta(fechaAlta)}
        </div>
      </CardContent>
    </Card>
  );
}
