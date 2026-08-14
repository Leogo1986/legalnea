import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function AltaAbogadoAprobadoEmail({
  nombreCompleto,
  linkActivacion,
}: {
  nombreCompleto: string;
  linkActivacion: string;
}) {
  return (
    <EmailLayout preview="Tu inscripción a la Red PROBONO fue aprobada">
      <Heading as="h2" style={{ fontSize: "18px", margin: "0 0 12px" }}>
        ¡Buenas noticias, {nombreCompleto.split(" ")[0]}!
      </Heading>
      <Text>
        Tu inscripción a la red PROBONO de Legal Nea fue <strong>aprobada</strong>.
        Ya podés activar tu cuenta y definir tu contraseña para acceder a tu
        panel de abogado.
      </Text>
      <Button
        href={linkActivacion}
        style={{
          backgroundColor: "#18181b",
          borderRadius: "8px",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 600,
          padding: "12px 20px",
          textDecoration: "none",
        }}
      >
        Activar mi cuenta
      </Button>
      <Text style={{ color: "#71717a", fontSize: "12px", marginTop: "16px" }}>
        Si el botón no funciona, copiá y pegá este link en tu navegador:
        <br />
        {linkActivacion}
      </Text>
    </EmailLayout>
  );
}
