import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function AltaClienteConfirmacionEmail({
  nombreCompleto,
  solicitudId,
}: {
  nombreCompleto: string;
  solicitudId: string;
}) {
  return (
    <EmailLayout preview="Recibimos tu solicitud de asistencia jurídica gratuita">
      <Heading as="h2" style={{ fontSize: "18px", margin: "0 0 12px" }}>
        Hola, {nombreCompleto.split(" ")[0]}
      </Heading>
      <Text>
        Recibimos tu solicitud de asistencia jurídica gratuita. Tu número de
        identificación es:
      </Text>
      <Text
        style={{
          backgroundColor: "#f4f4f5",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "13px",
          padding: "12px 16px",
        }}
      >
        {solicitudId}
      </Text>
      <Text>
        Un especialista de nuestra red PROBONO va a analizar tu caso y te
        vamos a contactar a la brevedad por el medio que nos indicaste.
      </Text>
      <Text>Gracias por confiar en nosotros.</Text>
    </EmailLayout>
  );
}
