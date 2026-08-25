"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth.schema";

const RUTA_POR_ROL: Record<string, string> = {
  admin: "/admin/dashboard",
  abogado: "/abogado/perfil",
  cliente: "/cliente/solicitud",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const errorEnlace = searchParams.get("error") === "enlace_invalido";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [enviando, setEnviando] = React.useState(false);

  async function onSubmit(datos: LoginInput) {
    setEnviando(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword(datos);

    if (error || !data.user) {
      setEnviando(false);
      toast.error("Email o contraseña incorrectos.");
      return;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", data.user.id)
      .single();

    setEnviando(false);

    const destino = redirect || (perfil ? RUTA_POR_ROL[perfil.rol] : null) || "/";
    router.push(destino);
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Ingresar</CardTitle>
        <CardDescription>Accedé a tu panel de Legal Nea Soft.</CardDescription>
      </CardHeader>
      <CardContent>
        {errorEnlace && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            El enlace que usaste no es válido o expiró. Pedí uno nuevo.
          </p>
        )}
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
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/recuperar-password" className="text-xs text-muted-foreground underline underline-offset-2">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={enviando} className="mt-2">
            {enviando ? <Loader2 className="animate-spin" /> : <LogIn />}
            Ingresar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        ¿Todavía no tenés cuenta? Se habilita cuando el equipo de Legal Nea
        aprueba tu alta de abogado o tu solicitud como cliente.
      </CardFooter>
    </Card>
  );
}
