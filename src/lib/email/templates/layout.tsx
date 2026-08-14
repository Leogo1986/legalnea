import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { ADMIN_EMAIL, CONTACTO_TELEFONO_DISPLAY, SITE_NAME } from "@/lib/constants";

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>
          <Section style={estilos.header}>
            <Text style={estilos.marca}>{SITE_NAME}</Text>
            <Text style={estilos.tagline}>Red PROBONO de Legal Nea</Text>
          </Section>

          <Section style={estilos.contenido}>{children}</Section>

          <Hr style={estilos.hr} />
          <Section>
            <Text style={estilos.footer}>
              Legal Nea · Corrientes, Argentina
              <br />
              Contacto: {CONTACTO_TELEFONO_DISPLAY} · {ADMIN_EMAIL}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const estilos = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#18181b",
    padding: "24px 32px",
  },
  marca: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 700,
    margin: 0,
  },
  tagline: {
    color: "#a1a1aa",
    fontSize: "12px",
    margin: "2px 0 0",
  },
  contenido: {
    padding: "28px 32px",
  },
  hr: {
    borderColor: "#e4e4e7",
    margin: "0",
  },
  footer: {
    color: "#a1a1aa",
    fontSize: "11px",
    lineHeight: "1.6",
    padding: "16px 32px 24px",
    textAlign: "center" as const,
  },
};
