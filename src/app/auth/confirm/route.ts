import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handler compartido para los links de invitación/recuperación de
// contraseña generados vía `supabase.auth.admin.generateLink`. El endpoint
// hosteado de Supabase valida el token y redirige acá con `?code=...`;
// acá lo canjeamos por una sesión real (esto SÍ puede escribir cookies,
// a diferencia de un Server Component) y mandamos al usuario a `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "enlace_invalido");
  return NextResponse.redirect(url);
}
