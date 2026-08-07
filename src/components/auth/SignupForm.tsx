"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function SignupForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signup, undefined);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <Card className="px-6 py-7">
      <h1 className="mb-1 text-xl font-bold">Criar conta</h1>
      <p className="mb-6 text-xs text-white/45">
        Todo check-in vem com foto. Sem foto, não conta.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            placeholder="Seu nome completo"
            autoComplete="name"
            error={state?.errors?.name?.[0]}
          />
        </div>
        <div>
          <Label htmlFor="username">Usuário</Label>
          <Input
            id="username"
            name="username"
            placeholder="seu_usuario"
            autoComplete="username"
            error={state?.errors?.username?.[0]}
          />
        </div>
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
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Pelo menos 8 caracteres"
            autoComplete="new-password"
            error={state?.errors?.password?.[0]}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            error={state?.errors?.confirmPassword?.[0]}
          />
        </div>

        {state?.message && (
          <p className="text-xs text-red-400" role="alert">
            {state.message}
          </p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-white/45">
        Já tem conta?{" "}
        <Link href={loginHref} className="font-semibold">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
