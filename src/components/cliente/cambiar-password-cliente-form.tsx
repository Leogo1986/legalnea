"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { nuevaPasswordSchema, type NuevaPasswordInput } from "@/lib/validation/auth.schema";

// Mismo patrón que cambiar-password-abogado-form.tsx: 100% client-side
// (supabase.auth.updateUser), útil sobre todo para que el cliente cambie la
// clave temporal que le mandamos por WhatsApp al aprobar su solicitud.
export function CambiarPasswordClienteForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NuevaPasswordInput>({
    resolver: zodResolver(nuevaPasswordSchema),
    defaultValues: { password: "", confirmar_password: "" },
  });

  const [guardando, setGuardando] = React.useState(false);

  async function onSubmit(datos: NuevaPasswordInput) {
    setGuardando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: datos.password });
    setGuardando(false);
    if (error) {
      toast.error("No pudimos actualizar tu contraseña. Probá de nuevo.");
      return;
    }
    toast.success("Contraseña actualizada.");
    reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cambiar contraseña</CardTitle>
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
          <Button type="submit" disabled={guardando} className="mt-2 w-fit">
            {guardando ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Guardar contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
