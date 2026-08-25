import { createAdminClient } from "@/lib/supabase/admin";
import { generarPasswordApartirDeNombre } from "@/lib/auth/generar-password";

type AdminClient = ReturnType<typeof createAdminClient>;

// Crea (o vincula, si ya existe) la cuenta de Auth del cliente. Se llama
// recién cuando el admin aprueba la solicitud (admin/solicitudes/actions.ts)
// — antes de eso el cliente no tiene forma de loguear, que es justamente el
// filtro: cualquiera puede mandar el formulario público, pero solo entra
// quien el equipo de Legal Nea aprobó.
//
// La cuenta se crea con una clave temporal generada acá mismo (no con
// generateLink({type:"invite"}) + mail) para poder mandársela directo por
// WhatsApp al aprobar, sin depender de que Resend esté configurado. Si el
// email ya tenía cuenta de una solicitud anterior, no se toca su clave
// (podría estar en uso) — devuelve `password: null` en ese caso; el admin
// puede generar una clave nueva a mano con "Generar nueva clave".
export async function vincularCuentaCliente(
  supabase: AdminClient,
  clienteId: string,
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
      await supabase.from("clientes").update({ user_id: perfilExistente.id }).eq("id", clienteId);
      return { password: null };
    }

    const password = await generarPasswordApartirDeNombre(supabase, nombreCompleto);
    const { data: creado, error: errorCreate } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (errorCreate || !creado?.user) {
      console.error("[vincularCuentaCliente] createUser falló:", errorCreate);
      return { password: null };
    }

    await supabase.from("perfiles").upsert({
      id: creado.user.id,
      rol: "cliente",
      nombre_completo: nombreCompleto,
      email,
    });
    await supabase.from("clientes").update({ user_id: creado.user.id }).eq("id", clienteId);

    return { password };
  } catch (error) {
    console.error("[vincularCuentaCliente] no se pudo crear/vincular la cuenta:", error);
    return { password: null };
  }
}
