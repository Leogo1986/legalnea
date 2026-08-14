import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function AltaAbogadoConfirmacionEmail({
  nombreCompleto,
  provincia,
  especialidades,
}: {
  nombreCompleto: string;
  provincia: string;
  especialidades: string[];
}) {
  return (
    <EmailLayout preview="Recibimos tu solicitud para sumarte a la Red PROBONO">
      <Heading as="h2" style={{ fontSize: "18px", margin: "0 0 12px" }}>
        ¡Gracias por sumarte, {nombreCompleto.split(" ")[0]}!
      </Heading>
      <Text>
        Recibimos tu inscripción a la red PROBONO de Legal Nea con los
        siguientes datos:
      </Text>
      <Text style={{ backgroundColor: "#f4f4f5", borderRadius: "8px", padding: "12px 16px" }}>
        <strong>Provincia:</strong> {provincia}
        <br />
        <strong>Áreas de actuación:</strong> {especialidades.join(", ")}
      </Text>
      <Text>
        Nuestro equipo va a revisar tu solicitud en un plazo de hasta{" "}
        <strong>48 horas hábiles</strong>. Te vamos a escribir a este mismo
        email con la novedad.
      </Text>
      <Text>Gracias por donar tu tiempo profesional para una buena causa.</Text>
    </EmailLayout>
  );
}
