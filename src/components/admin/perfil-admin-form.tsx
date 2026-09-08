"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, Save, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminPerfilSchema, type AdminPerfilInput } from "@/lib/validation/admin.schema";
import { actualizarPerfilAdmin } from "@/app/admin/perfil/actions";

export function PerfilAdminForm({
  admin,
}: {
  admin: { nombre_completo: string; email: string; telefono: string | null };
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminPerfilInput>({
    resolver: zodResolver(adminPerfilSchema),
    defaultValues: {
      nombre_completo: admin.nombre_completo,
      telefono: admin.telefono ?? "",
    },
  });

  const [guardando, setGuardando] = React.useState(false);

  async function onSubmit(datos: AdminPerfilInput) {
    setGuardando(true);
    const res = await actualizarPerfilAdmin(datos);
    setGuardando(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Datos actualizados.");
  }

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-br from-primary/8 to-transparent">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-primary" />
          <CardTitle className="text-lg">Mis datos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="email">
              <Mail className="mr-1 inline size-3.5" />
              Email (no editable)
            </Label>
            <Input id="email" value={admin.email} disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nombre_completo">Nombre y apellido</Label>
              <Input id="nombre_completo" {...register("nombre_completo")} />
              {errors.nombre_completo && (
                <p className="text-sm text-destructive">{errors.nombre_completo.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="telefono">Celular / WhatsApp</Label>
              <Input id="telefono" {...register("telefono")} />
              {errors.telefono && (
                <p className="text-sm text-destructive">{errors.telefono.message}</p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={guardando} className="mt-2 w-fit">
            {guardando ? <Loader2 className="animate-spin" /> : <Save />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
