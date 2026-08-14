"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  recuperarPasswordSchema,
  type RecuperarPasswordInput,
} from "@/lib/validation/auth.schema";
import { solicitarRecuperacion } from "@/app/(auth)/recuperar-password/actions";

export function RecuperarPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarPasswordInput>({
    resolver: zodResolver(recuperarPasswordSchema),
    defaultValues: { email: "" },
  });

  const [enviando, setEnviando] = React.useState(false);
  const [enviado, setEnviado] = React.useState(false);

  async function onSubmit(datos: RecuperarPasswordInput) {
    setEnviando(true);
    await solicitarRecuperacion(datos);
    setEnviando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <MailCheck className="size-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Si ese email está registrado, te enviamos un link para
            restablecer tu contraseña. Revisá tu bandeja de entrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Te mandamos un link para definir una nueva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" disabled={enviando} className="mt-2">
            {enviando && <Loader2 className="animate-spin" />}
            Enviar link
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
