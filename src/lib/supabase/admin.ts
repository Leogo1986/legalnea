import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Cliente Supabase con Service Role Key — BYPASS de RLS.
// USO EXCLUSIVO en Server Actions / Route Handlers (nunca en Client Components).
// Necesario para: crear usuarios de Auth tras aprobación, resetear contraseñas,
// operaciones administrativas que ignoran RLS a propósito.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
