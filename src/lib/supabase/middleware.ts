import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const RUTAS_ADMIN = ["/admin"];
const RUTAS_ABOGADO = ["/abogado"];
const RUTAS_CLIENTE = ["/cliente"];
const RUTAS_PROTEGIDAS = [...RUTAS_ADMIN, ...RUTAS_ABOGADO, ...RUTAS_CLIENTE];

// "/abogado" (panel protegido) no debe capturar "/abogados/nuevo" (alta
// pública) ni "/cliente" capturar "/clientes/nuevo" — hace falta un límite
// de segmento, no un simple startsWith.
function coincideRuta(pathname: string, prefijo: string) {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaProtegida = RUTAS_PROTEGIDAS.some((r) => coincideRuta(pathname, r));

  if (!esRutaProtegida) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const rol = perfil?.rol;

  const sinPermiso =
    (RUTAS_ADMIN.some((r) => coincideRuta(pathname, r)) && rol !== "admin") ||
    (RUTAS_ABOGADO.some((r) => coincideRuta(pathname, r)) && rol !== "abogado") ||
    (RUTAS_CLIENTE.some((r) => coincideRuta(pathname, r)) && rol !== "cliente");

  if (sinPermiso) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
