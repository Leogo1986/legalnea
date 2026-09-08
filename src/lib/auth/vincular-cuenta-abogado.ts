import { createAdminClient } from "@/lib/supabase/admin";
import { generarPasswordApartirDeNombre } from "@/lib/auth/generar-password";

type AdminClient = ReturnType<typeof createAdminClient>;

// Simétrico a lib/auth/vincular-cuenta-cliente.ts, para abogados: se llama
// recién cuando el admin aprueba el alta (admin/abogados/actions.ts). Antes
// usaba `generateLink({type:"invite"})` + mail de Resend — el abogado nunca
// se enteraba de que fue aprobado ni tenía forma de loguear porque Resend no
// está configurado. Ahora la cuenta se crea acá mismo con una clave
// determinística (Nombre+Año, ver generar-password.ts) para que el admin la
// mande directo por WhatsApp, sin depender de ningún mail.
export async function vincularCuentaAbogado(
  supabase: AdminClient,
  abogadoId: string,
  email: string,
  nombreCompleto: string
): Promise<{ password: string | null }> {
  try {
    const { data: perfilExistente } = await supabase
      .from("perfiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (perfilExistente) {
      await supabase.from("abogados").update({ user_id: perfilExistente.id }).eq("id", abogadoId);
      return { password: null };
    }

    const password = await generarPasswordApartirDeNombre(supabase, nombreCompleto, undefined, "abogado");
    const { data: creado, error: errorCreate } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (errorCreate || !creado?.user) {
      console.error("[vincularCuentaAbogado] createUser falló:", errorCreate);
      return { password: null };
    }

    await supabase.from("perfiles").upsert({
      id: creado.user.id,
      rol: "abogado",
      nombre_completo: nombreCompleto,
      email,
    });
    await supabase.from("abogados").update({ user_id: creado.user.id }).eq("id", abogadoId);

    return { password };
  } catch (error) {
    console.error("[vincularCuentaAbogado] no se pudo crear/vincular la cuenta:", error);
    return { password: null };
  }
}
