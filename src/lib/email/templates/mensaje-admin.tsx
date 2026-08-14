import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function MensajeAdminEmail({
  nombreDestinatario,
  mensaje,
  linkPanel,
}: {
  nombreDestinatario: string;
  mensaje: string;
  linkPanel: string;
}) {
  return (
    <EmailLayout preview="Tenés un nuevo mensaje en Legal Nea Soft">
      <Heading as="h2" style={{ fontSize: "18px", margin: "0 0 12px" }}>
        Hola, {nombreDestinatario.split(" ")[0]}
      </Heading>
      <Text>Legal Nea te escribió:</Text>
      <Text style={{ backgroundColor: "#f4f4f5", borderRadius: "8px", padding: "12px 16px" }}>
        {mensaje}
      </Text>
      <Text>
        Podés responder desde tu panel: <a href={linkPanel}>{linkPanel}</a>
      </Text>
    </EmailLayout>
  );
}
