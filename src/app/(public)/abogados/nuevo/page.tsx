import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AbogadoAltaForm } from "@/components/forms/abogado-alta-form";
import { ListadoAbogados } from "@/components/public/listado-abogados";

export const metadata: Metadata = {
  title: "Sumate como abogado — Legal Nea Soft",
  description:
    "Inscribite en la red PROBONO de Legal Nea y sumate como abogado voluntario.",
};

export default async function AltaAbogadoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("especialidades")
    .select("id, nombre, categoria")
    .eq("activa", true)
    .order("categoria", { ascending: false })
    .order("nombre", { ascending: true });

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <AbogadoAltaForm especialidades={data ?? []} />
      </div>
      <div className="border-t">
        <ListadoAbogados />
      </div>
    </>
  );
}
