import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Scale className="size-5 text-primary" />
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              render={<Link href={link.href} />}
            >
              {link.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link href="/login" />}
          >
            Ingresar
          </Button>
          <Button size="sm" className="sm:hidden" render={<Link href="/clientes/nuevo" />}>
            Pedí ayuda
          </Button>
        </div>
      </div>
    </header>
  );
}
