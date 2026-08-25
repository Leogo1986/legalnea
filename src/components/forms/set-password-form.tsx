"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { nuevaPasswordSchema, type NuevaPasswordInput } from "@/lib/validation/auth.schema";

const RUTA_POR_ROL: Record<string, string> = {
  admin: "/admin/dashboard",
  abogado: "/abogado/dashboard",
  cliente: "/cliente/dashboard",
};

export function SetPasswordForm({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NuevaPasswordInput>({
    resolver: zodResolver(nuevaPasswordSchema),
    defaultValues: { password: "", confirmar_password: "" },
  });

  const [enviando, setEnviando] = React.useState(false);

  async function onSubmit(datos: NuevaPasswordInput) {
    setEnviando(true);
    const supabase = createClient();

    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) {
      setEnviando(false);
      toast.error("Tu enlace expiró. Pedí uno nuevo desde \"¿Olvidaste tu contraseña?\".");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: datos.password });
    if (error) {
      setEnviando(false);
      toast.error("No pudimos actualizar tu contraseña. Probá de nuevo.");
      return;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", sesion.session.user.id)
      .single();

    toast.success("Contraseña actualizada.");
    setEnviando(false);
    router.push((perfil ? RUTA_POR_ROL[perfil.rol] : null) || "/");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="border-b bg-gradient-to-br from-primary/8 to-transparent">
        <CardTitle className="text-xl">{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmar_password">Confirmar contraseña</Label>
            <PasswordInput
              id="confirmar_password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmar_password}
              {...register("confirmar_password")}
            />
            {errors.confirmar_password && (
              <p className="text-sm text-destructive">{errors.confirmar_password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={enviando} className="mt-2">
            {enviando ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Guardar contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
