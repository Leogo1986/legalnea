import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Ingresar — Legal Nea Soft",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
