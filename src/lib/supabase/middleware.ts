import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const RUTAS_ADMIN = ["/admin"];
const RUTAS_ABOGADO = ["/abogado"];
const RUTAS_CLIENTE = ["/cliente"];
const RUTAS_PROTEGIDAS = [...RUTAS_ADMIN, ...RUTAS_ABOGADO, ...RUTAS_CLIENTE];

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
  const esRutaProtegida = RUTAS_PROTEGIDAS.some((r) => pathname.startsWith(r));

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
    (RUTAS_ADMIN.some((r) => pathname.startsWith(r)) && rol !== "admin") ||
    (RUTAS_ABOGADO.some((r) => pathname.startsWith(r)) && rol !== "abogado") ||
    (RUTAS_CLIENTE.some((r) => pathname.startsWith(r)) && rol !== "cliente");

  if (sinPermiso) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
