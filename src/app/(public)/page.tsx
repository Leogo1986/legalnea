import Link from "next/link";
import { Scale, HandHeart, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CONTACTO_WHATSAPP_URL } from "@/lib/constants";

async function getStats() {
  const supabase = await createClient();

  const [{ count: totalAbogados }, { data: provinciasData }] = await Promise.all([
    supabase.from("abogados").select("id", { count: "exact", head: true }).eq("estado", "aprobado"),
    supabase.from("abogados").select("provincia").eq("estado", "aprobado"),
  ]);

  const provincias = new Set((provinciasData ?? []).map((a) => a.provincia));

  return {
    totalAbogados: totalAbogados ?? 0,
    totalProvincias: provincias.size,
  };
}

export default async function LandingPage() {
  const { totalAbogados, totalProvincias } = await getStats();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Scale className="size-3.5" />
            Red PROBONO de Legal Nea
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Acceso a la justicia, sin importar lo que puedas pagar
          </h1>
          <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
            Legal Nea Soft conecta a personas que necesitan asesoramiento
            legal gratuito con abogados voluntarios que donan su tiempo bajo
            la modalidad <strong>PROBONO</strong>: trabajo profesional sin
            costo para quien no puede pagarlo.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/clientes/nuevo" />}>
              Necesito ayuda legal
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/abogados/nuevo" />}
            >
              Soy abogado, quiero sumarme
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-2">
          <Card className="text-center">
            <CardContent className="py-6">
              <p className="font-heading text-3xl font-semibold text-primary">
                {totalAbogados}
              </p>
              <p className="text-sm text-muted-foreground">
                Abogados voluntarios activos
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-6">
              <p className="font-heading text-3xl font-semibold text-primary">
                {totalProvincias}
              </p>
              <p className="text-sm text-muted-foreground">
                Provincias con cobertura
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-heading text-xl font-semibold sm:text-2xl">
            ¿Cómo funciona PROBONO?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <HandHeart className="size-6 text-primary" />
                <CardTitle>Pedís tu consulta</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Contanos tu situación desde el formulario de solicitud. Es
                gratis y confidencial.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="size-6 text-primary" />
                <CardTitle>Te asignamos un abogado</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Un abogado voluntario de la especialidad que corresponda toma
                tu caso sin costo.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ShieldCheck className="size-6 text-primary" />
                <CardTitle>Recibís asesoramiento real</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Seguimiento del caso hasta su resolución, con la misma
                seriedad profesional de siempre.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-heading text-xl font-semibold sm:text-2xl">
          ¿Sos abogado y querés donar tu tiempo?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Sumate a la red PROBONO de Legal Nea. Completá tu inscripción,
          aceptá la declaración jurada y empezá a recibir casos afines a tu
          especialidad.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<Link href="/abogados/nuevo" />}>
            Quiero sumarme como abogado
          </Button>
          <Button
            variant="ghost"
            render={
              <a href={CONTACTO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />
            }
          >
            Consultar por WhatsApp
          </Button>
        </div>
      </section>
    </>
  );
}
