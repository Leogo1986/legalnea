import { NextResponse, type NextRequest } from "next/server";
import { generarPdfDeclaracionJurada } from "@/lib/pdf/declaracion-jurada-pdf";

// Genera el PDF de la Declaración Jurada al vuelo (no hay archivo estático),
// tanto para la previsualización dentro del modal (antes de aceptar/enviar)
// como para adjuntarlo al registro una vez aceptada.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.nombreCompleto !== "string" ||
    typeof body.email !== "string" ||
    typeof body.provincia !== "string"
  ) {
    return NextResponse.json(
      { error: "Faltan datos para generar el PDF." },
      { status: 400 }
    );
  }

  const buffer = await generarPdfDeclaracionJurada({
    nombreCompleto: body.nombreCompleto,
    email: body.email,
    provincia: body.provincia,
    matriculaFederal: body.matriculaFederal ?? null,
    matriculaProvincial: body.matriculaProvincial ?? null,
    fechaAceptacion: new Date(),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="declaracion-jurada-legal-nea.pdf"',
    },
  });
}
