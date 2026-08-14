import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function ReseteoPasswordEmail({
  nombreCompleto,
  linkReseteo,
}: {
  nombreCompleto: string;
  linkReseteo: string;
}) {
  return (
    <EmailLayout preview="Restablecé tu contraseña de Legal Nea Soft">
      <Heading as="h2" style={{ fontSize: "18px", margin: "0 0 12px" }}>
        Hola, {nombreCompleto.split(" ")[0]}
      </Heading>
      <Text>
        Recibimos un pedido para restablecer tu contraseña. Hacé click en el
        botón para definir una nueva:
      </Text>
      <Button
        href={linkReseteo}
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
        Restablecer contraseña
      </Button>
      <Text style={{ color: "#71717a", fontSize: "12px", marginTop: "16px" }}>
        Si no pediste este cambio, podés ignorar este email — tu contraseña
        actual sigue funcionando.
        <br />
        Si el botón no funciona, copiá y pegá este link en tu navegador:
        <br />
        {linkReseteo}
      </Text>
    </EmailLayout>
  );
}
