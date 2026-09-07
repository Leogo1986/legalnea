import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-heading text-xl font-bold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="size-6" />
          </span>
          {SITE_NAME}
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <Button render={<Link href="/clientes/nuevo" />}>Necesito ayuda legal</Button>
          <Button variant="outline" render={<Link href="/abogados/nuevo" />}>
            Soy abogado, quiero sumarme
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            render={<Link href="/login" />}
          >
            Ingresar
          </Button>
          <Button className="sm:hidden" render={<Link href="/clientes/nuevo" />}>
            Pedí ayuda
          </Button>
        </div>
      </div>
    </header>
  );
}
