import { NextResponse, type NextRequest } from "next/server";

// Proxy a Nominatim/OpenStreetMap (gratuito, sin API key) para autocompletar
// domicilio. Nominatim exige un User-Agent identificable y no debe pegarse
// directo desde el browser (política de uso), por eso pasa por acá.
// Devuelve como mucho 5 sugerencias, acotadas a Argentina.

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
};

export type SugerenciaDireccion = {
  displayName: string;
  lat: number;
  lon: number;
  provincia: string | null;
  localidad: string | null;
  codigoPostal: string | null;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ sugerencias: [] satisfies SugerenciaDireccion[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "ar");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", q);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          process.env.NOMINATIM_USER_AGENT ??
          "LegalNeaSoft/1.0 (contacto: bitcorrientes@gmail.com)",
        "Accept-Language": "es-AR,es",
      },
      // Nominatim pide no cachear agresivamente de más ni pegarle muy seguido;
      // este cache corto alivia reintentos del mismo usuario tipeando.
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ sugerencias: [] satisfies SugerenciaDireccion[] });
    }

    const data = (await res.json()) as NominatimResult[];

    const sugerencias: SugerenciaDireccion[] = data.map((r) => ({
      displayName: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      provincia: r.address?.state ?? null,
      localidad:
        r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.municipality ?? null,
      codigoPostal: r.address?.postcode ?? null,
    }));

    return NextResponse.json({ sugerencias });
  } catch {
    // Si Nominatim falla o no responde, no bloqueamos el formulario:
    // los campos quedan editables manualmente.
    return NextResponse.json({ sugerencias: [] satisfies SugerenciaDireccion[] });
  }
}
