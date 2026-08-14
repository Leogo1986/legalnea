"use client";

import { useRouter } from "next/navigation";
import { LogOut, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

export function ClienteNav({ nombre }: { nombre: string }) {
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
        <span className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Scale className="size-4 text-primary" />
          {SITE_NAME}
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{nombre}</span>
          <Button variant="ghost" size="sm" onClick={salir}>
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
