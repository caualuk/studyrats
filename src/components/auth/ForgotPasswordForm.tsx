"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/passwordReset";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <Card className="px-6 py-7 text-center">
        <h1 className="mb-2 text-xl font-bold">Confira seu e-mail.</h1>
        <p className="mb-6 text-xs text-white/50">{state.message}</p>
        <Link href="/login" className="text-xs font-semibold text-accent">
          Voltar para o login
        </Link>
      </Card>
    );
  }

  return (
    <Card className="px-6 py-7">
      <h1 className="mb-1 text-xl font-bold">Esqueceu a senha?</h1>
      <p className="mb-6 text-xs text-white/45">
        Informe seu e-mail e enviamos um link para você criar uma senha nova.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            error={state?.errors?.email?.[0]}
          />
        </div>

        {state?.message && (
          <p className="text-xs text-red-400" role="alert">
            {state.message}
          </p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Enviando..." : "Enviar link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-white/45">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
