import Link from "next/link";
import type { ReactNode } from "react";
import { Scale } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold">
        <Scale className="size-5 text-primary" />
        {SITE_NAME}
      </Link>
      <div className="w-full">{children}</div>
    </div>
  );
}
