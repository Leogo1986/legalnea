import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

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

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              render={<Link href={link.href} />}
            >
              {link.label}
            </Button>
          ))}
        </nav>

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
