"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download, Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineCaso } from "@/components/casos/timeline-caso";
import { ChatCaso } from "@/components/casos/chat-caso";
import {
  agregarEventoCaso,
  enviarMensajeAbogado,
  marcarMensajesLeidos,
  obtenerUrlFirmadaPropia,
} from "@/app/abogado/solicitudes/actions";
import type { EstadoSolicitud, Prioridad, Rol } from "@/types/database";

type Solicitud = {
  id: string;
  motivo_consulta: string;
  descripcion: string;
  estado: EstadoSolicitud;
  prioridad: Prioridad;
  created_at: string;
  cliente: {
    nombre_completo: string;
    email: string;
    telefono: string;
    direccion: string | null;
    provincia: string;
    localidad: string;
  };
  adjuntos: { id: string; nombre: string; ruta: string }[];
  mensajes: { id: string; contenido: string; autorRol: Rol; createdAt: string }[];
  eventos: { id: string; etapa: string; nota: string | null; autorRol: Rol; createdAt: string }[];
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(fecha));
}

export function DetalleCasoAbogado({ solicitud }: { solicitud: Solicitud }) {
  async function descargar(ruta: string) {
    const { url } = await obtenerUrlFirmadaPropia(ruta);
    if (!url) {
      toast.error("No pudimos generar el link de descarga.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/abogado/solicitudes" />}>
          <ArrowLeft className="size-4" />
          Volver a solicitudes
        </Button>
        <div className="flex gap-1.5">
          <Badge variant="outline">{solicitud.estado.replace("_", " ")}</Badge>
          <Badge variant="outline">{solicitud.prioridad}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{solicitud.cliente.nombre_completo}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1.5 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="size-3.5" /> {solicitud.cliente.email}
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="size-3.5" /> {solicitud.cliente.telefono}
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground sm:col-span-2">
            <MapPin className="size-3.5" />
            {solicitud.cliente.direccion ? `${solicitud.cliente.direccion}, ` : ""}
            {solicitud.cliente.localidad}, {solicitud.cliente.provincia}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="detalle">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle" className="grid gap-4 pt-3">
          <Card>
            <CardContent className="grid gap-3 py-4 text-sm">
              <div>
                <p className="font-medium">Motivo de consulta</p>
                <p className="text-muted-foreground">{solicitud.motivo_consulta}</p>
              </div>
              <div>
                <p className="font-medium">Descripción</p>
                <p className="text-muted-foreground">{solicitud.descripcion}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Recibida el {formatearFecha(solicitud.created_at)}
              </p>
            </CardContent>
          </Card>
          {solicitud.adjuntos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {solicitud.adjuntos.map((a) => (
                <Button key={a.id} variant="outline" size="sm" onClick={() => descargar(a.ruta)}>
                  <Download className="size-3.5" />
                  {a.nombre}
                </Button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="pt-3">
          <TimelineCaso
            eventos={solicitud.eventos}
            soloLectura={false}
            onAgregar={(etapa, nota) => agregarEventoCaso(solicitud.id, etapa, nota)}
          />
        </TabsContent>

        <TabsContent value="mensajes" className="pt-3">
          <ChatCaso
            mensajes={solicitud.mensajes}
            onEnviar={(contenido) => enviarMensajeAbogado(solicitud.id, contenido)}
            onAbrir={() => {
              void marcarMensajesLeidos(solicitud.id);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
