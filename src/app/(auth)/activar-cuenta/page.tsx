import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/forms/set-password-form";

export const metadata: Metadata = {
  title: "Activar cuenta — Legal Nea Soft",
};

export default function ActivarCuentaPage() {
  return (
    <SetPasswordForm
      titulo="Activá tu cuenta"
      descripcion="Definí una contraseña para acceder a tu panel."
    />
  );
}
