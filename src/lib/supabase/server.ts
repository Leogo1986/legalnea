import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Cliente Supabase para Server Components / Server Actions / Route Handlers.
// Respeta RLS (usa la clave anónima + cookies de sesión del usuario).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // set() puede fallar si se llama desde un Server Component puro (sin Route Handler/Action).
            // El middleware se encarga de refrescar la sesión en ese caso.
          }
        },
      },
    }
  );
}
