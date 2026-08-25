import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

type AdminClient = ReturnType<typeof createAdminClient>;

// Crea (o vincula, si ya existe) la cuenta de Auth del cliente. Se llama
// recién cuando el admin aprueba la solicitud (admin/solicitudes/actions.ts)
// — antes de eso el cliente no tiene forma de loguear, que es justamente el
// filtro: cualquiera puede mandar el formulario público, pero solo entra
// quien el equipo de Legal Nea aprobó. Mismo fix de email_confirm que en
// aprobarAbogado: generateLink({type:"invite"}) deja la cuenta sin confirmar
// hasta que se clickea el link del mail, y ese mail puede no llegar (Resend
// sin configurar todavía) — la aprobación del admin ya es el gate real, así
// que confirmamos el email nosotros mismos. No bloqueante: si esto falla, la
// solicitud ya quedó aprobada igual y el admin puede resolverlo a mano
// (botón "Restablecer contraseña del cliente").
export async function vincularCuentaCliente(
  supabase: AdminClient,
  clienteId: string,
  email: string,
  nombreCompleto: string
): Promise<void> {
  try {
    const { data: perfilExistente } = await supabase
      .from("perfiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (perfilExistente) {
      await supabase.from("clientes").update({ user_id: perfilExistente.id }).eq("id", clienteId);
      return;
    }

    const { data: invitado, error: errorInvite } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: `${getSiteUrl()}/auth/confirm?next=/actualizar-password` },
    });

    if (errorInvite || !invitado?.user) return;

    await supabase.auth.admin.updateUserById(invitado.user.id, { email_confirm: true });
    await supabase.from("perfiles").upsert({
      id: invitado.user.id,
      rol: "cliente",
      nombre_completo: nombreCompleto,
      email,
    });
    await supabase.from("clientes").update({ user_id: invitado.user.id }).eq("id", clienteId);
  } catch (error) {
    console.error("[vincularCuentaCliente] no se pudo crear/vincular la cuenta:", error);
  }
}
