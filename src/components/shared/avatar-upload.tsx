"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const TIPOS_ACEPTADOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANIO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2MB

// Sube la foto de perfil directo desde el navegador (mismo criterio que el
// cambio de contraseña: sin server action, la propia policy de Storage
// restringe la escritura al dueño — ver migración 0006_avatar_perfil.sql).
// El nombre del objeto en el bucket "avatars" es siempre el user id, así que
// cada subida pisa la anterior (upsert) y no quedan archivos huérfanos.
export function AvatarUpload({
  userId,
  nombreCompleto,
  avatarUrlInicial,
}: {
  userId: string;
  nombreCompleto: string;
  avatarUrlInicial: string | null;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(avatarUrlInicial);
  const [subiendo, setSubiendo] = React.useState(false);

  const iniciales = nombreCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  async function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!archivo) return;

    if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
      toast.error("Usá una imagen JPG, PNG o WEBP.");
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO_BYTES) {
      toast.error("La imagen no puede pesar más de 2MB.");
      return;
    }

    const previewLocal = URL.createObjectURL(archivo);
    setPreview(previewLocal);
    setSubiendo(true);

    const supabase = createClient();
    const { error: errorSubida } = await supabase.storage
      .from("avatars")
      .upload(userId, archivo, { upsert: true, contentType: archivo.type });

    if (errorSubida) {
      setSubiendo(false);
      toast.error("No pudimos subir la imagen.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(userId);
    // Cache-busting: el nombre del objeto no cambia entre subidas (siempre
    // es el user id), así que sin esto el navegador podría seguir mostrando
    // la imagen vieja cacheada.
    const urlConCacheBust = `${data.publicUrl}?t=${Date.now()}`;

    const { error: errorUpdate } = await supabase
      .from("perfiles")
      .update({ avatar_url: urlConCacheBust })
      .eq("id", userId);

    setSubiendo(false);

    if (errorUpdate) {
      toast.error("La imagen se subió pero no pudimos guardarla en tu perfil.");
      return;
    }

    setPreview(urlConCacheBust);
    toast.success("Foto de perfil actualizada.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="size-16">
          <AvatarImage src={preview ?? undefined} alt={nombreCompleto} />
          <AvatarFallback className="text-lg">{iniciales}</AvatarFallback>
        </Avatar>
        {subiendo && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="size-5 animate-spin" />
          </span>
        )}
      </div>
      <div className="grid gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={subiendo}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-3.5" />
          Cambiar foto
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máximo 2MB.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={alElegirArchivo}
      />
    </div>
  );
}
