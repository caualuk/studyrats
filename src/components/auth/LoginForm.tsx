"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const registroHref = next ? `/registro?next=${encodeURIComponent(next)}` : "/registro";

  return (
    <Card className="px-6 py-7">
      <h1 className="mb-1 text-xl font-bold">Entrar</h1>
      <p className="mb-6 text-xs text-white/45">
        Bem-vindo de volta. Bora manter a sequência.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <Label htmlFor="identifier">E-mail ou usuário</Label>
          <Input
            id="identifier"
            name="identifier"
            placeholder="voce@email.com"
            autoComplete="username"
            error={state?.errors?.identifier?.[0]}
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={state?.errors?.password?.[0]}
          />
        </div>

        {state?.message && (
          <p className="text-xs text-red-400" role="alert">
            {state.message}
          </p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-white/45">
        Ainda não tem conta?{" "}
        <Link href={registroHref} className="font-semibold">
          Criar conta
        </Link>
      </p>
    </Card>
  );
}
