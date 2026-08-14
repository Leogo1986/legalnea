import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/forms/set-password-form";

export const metadata: Metadata = {
  title: "Actualizar contraseña — Legal Nea Soft",
};

export default function ActualizarPasswordPage() {
  return (
    <SetPasswordForm
      titulo="Elegí tu nueva contraseña"
      descripcion="Definí una contraseña nueva para tu cuenta."
    />
  );
}
