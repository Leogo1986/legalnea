import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import {
  CONTENIDO_DECLARACION_JURADA,
  TITULO_DECLARACION_JURADA,
} from "@/lib/legal/declaracion-jurada";
import { SITE_NAME } from "@/lib/constants";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  marca: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#666666",
    marginBottom: 18,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titulo: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    marginBottom: 18,
    textAlign: "center",
  },
  considerando: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginTop: 12,
    marginBottom: 8,
  },
  parrafo: {
    marginBottom: 10,
    textAlign: "justify",
  },
  item: {
    marginBottom: 10,
    textAlign: "justify",
  },
  itemNumero: {
    fontFamily: "Times-Bold",
  },
  datosSuscriptor: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1pt solid #cccccc",
  },
  filaDato: {
    flexDirection: "row",
    marginBottom: 4,
  },
  labelDato: {
    fontFamily: "Times-Bold",
    width: 140,
  },
  valorDato: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#888888",
    textAlign: "center",
  },
});

export type DatosSuscriptorDJ = {
  nombreCompleto: string;
  email: string;
  provincia: string;
  matriculaFederal?: string | null;
  matriculaProvincial?: string | null;
  fechaAceptacion: Date;
};

function DeclaracionJuradaDocument({ datos }: { datos: DatosSuscriptorDJ }) {
  const fecha = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(datos.fechaAceptacion);

  return (
    <Document
      title={TITULO_DECLARACION_JURADA}
      author={SITE_NAME}
      subject={`Declaración Jurada — ${datos.nombreCompleto}`}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.marca}>{SITE_NAME} — Red PROBONO</Text>
        <Text style={styles.titulo}>{TITULO_DECLARACION_JURADA}</Text>

        {CONTENIDO_DECLARACION_JURADA.map((bloque, i) => {
          if (bloque.tipo === "considerando") {
            return (
              <Text key={i} style={styles.considerando}>
                {bloque.texto}
              </Text>
            );
          }
          if (bloque.tipo === "item") {
            return (
              <Text key={i} style={styles.item}>
                <Text style={styles.itemNumero}>{bloque.numero}. </Text>
                {bloque.texto}
              </Text>
            );
          }
          return (
            <Text key={i} style={styles.parrafo}>
              {bloque.texto}
            </Text>
          );
        })}

        <View style={styles.datosSuscriptor}>
          <View style={styles.filaDato}>
            <Text style={styles.labelDato}>Suscribe:</Text>
            <Text style={styles.valorDato}>{datos.nombreCompleto}</Text>
          </View>
          <View style={styles.filaDato}>
            <Text style={styles.labelDato}>Email:</Text>
            <Text style={styles.valorDato}>{datos.email}</Text>
          </View>
          <View style={styles.filaDato}>
            <Text style={styles.labelDato}>Provincia:</Text>
            <Text style={styles.valorDato}>{datos.provincia}</Text>
          </View>
          {(datos.matriculaFederal || datos.matriculaProvincial) && (
            <View style={styles.filaDato}>
              <Text style={styles.labelDato}>Matrícula:</Text>
              <Text style={styles.valorDato}>
                {[datos.matriculaFederal, datos.matriculaProvincial]
                  .filter(Boolean)
                  .join(" / ")}
              </Text>
            </View>
          )}
          <View style={styles.filaDato}>
            <Text style={styles.labelDato}>Fecha de aceptación:</Text>
            <Text style={styles.valorDato}>{fecha}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          {SITE_NAME} · Documento generado electrónicamente al momento de la aceptación.
        </Text>
      </Page>
    </Document>
  );
}

export async function generarPdfDeclaracionJurada(
  datos: DatosSuscriptorDJ
): Promise<Buffer> {
  return renderToBuffer(<DeclaracionJuradaDocument datos={datos} />);
}
