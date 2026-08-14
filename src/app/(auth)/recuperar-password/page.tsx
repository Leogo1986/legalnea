import type { Metadata } from "next";
import { RecuperarPasswordForm } from "@/components/forms/recuperar-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña — Legal Nea Soft",
};

export default function RecuperarPasswordPage() {
  return <RecuperarPasswordForm />;
}
