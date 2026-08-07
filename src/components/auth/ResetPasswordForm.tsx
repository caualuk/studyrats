"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/auth/passwordReset";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function ResetPasswordForm({ token }: { token: string }) {
  const submitReset = resetPassword.bind(null, token);
  const [state, formAction, pending] = useActionState(submitReset, undefined);

  return (
    <Card className="px-6 py-7">
      <h1 className="mb-1 text-xl font-bold">Nova senha</h1>
      <p className="mb-6 text-xs text-white/45">Escolha uma nova senha para sua conta.</p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">Nova senha</Label>
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
          {pending ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    </Card>
  );
}
