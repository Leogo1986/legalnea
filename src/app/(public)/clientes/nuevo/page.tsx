import type { Metadata } from "next";
import { ClienteAltaForm } from "@/components/forms/cliente-alta-form";

export const metadata: Metadata = {
  title: "Pedí ayuda legal — Legal Nea Soft",
  description:
    "Pedí asistencia jurídica gratuita a la red PROBONO de Legal Nea.",
};

export default function AltaClientePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <ClienteAltaForm />
    </div>
  );
}
