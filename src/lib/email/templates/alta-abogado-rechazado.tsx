import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { ADMIN_EMAIL } from "@/lib/constants";

export function AltaAbogadoRechazadoEmail({
  nombreCompleto,
  motivo,
}: {
  nombreCompleto: string;
  motivo?: string | null;
}) {
  return (
    <EmailLayout preview="Novedades sobre tu inscripción a la Red PROBONO">
      <Heading as="h2" style={{ fontSize: "18px", margin: "0 0 12px" }}>
        Hola, {nombreCompleto.split(" ")[0]}
      </Heading>
      <Text>
        Gracias por tu interés en sumarte a la red PROBONO de Legal Nea. Luego
        de revisar tu inscripción, en esta oportunidad no vamos a poder
        avanzar con tu alta.
      </Text>
      {motivo && (
        <Text style={{ backgroundColor: "#f4f4f5", borderRadius: "8px", padding: "12px 16px" }}>
          {motivo}
        </Text>
      )}
      <Text>
        Valoramos mucho tu voluntad de donar tu tiempo profesional. Si
        considerás que hubo un error o querés más información, podés
        escribirnos a {ADMIN_EMAIL}.
      </Text>
    </EmailLayout>
  );
}
