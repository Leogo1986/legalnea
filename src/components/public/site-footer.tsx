import Link from "next/link";
import { MessageCircle, Phone, Mail } from "lucide-react";
import {
  ADMIN_EMAIL,
  CONTACTO_TELEFONO_DISPLAY,
  CONTACTO_WHATSAPP_URL,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold">{SITE_NAME}</p>
          <p className="text-sm text-muted-foreground">{SITE_TAGLINE}</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Asesoramiento legal gratuito para quienes no pueden acceder a un
            abogado particular, gracias a la red de voluntarios PROBONO.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <a
            href={CONTACTO_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            WhatsApp: {CONTACTO_TELEFONO_DISPLAY}
          </a>
          <a
            href={`tel:${CONTACTO_TELEFONO_DISPLAY.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-4" />
            {CONTACTO_TELEFONO_DISPLAY}
          </a>
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Mail className="size-4" />
            {ADMIN_EMAIL}
          </a>
        </div>
      </div>

      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME} — Legal Nea, Corrientes.{" "}
        <Link href="/login" className="underline underline-offset-2">
          Acceso interno
        </Link>
      </div>
    </footer>
  );
}
