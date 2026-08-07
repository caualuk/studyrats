"use client";

import { useActionState, useEffect, useRef } from "react";
import { joinChallenge } from "@/lib/challenges/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function JoinChallengeForm() {
  const [state, formAction, pending] = useActionState(joinChallenge, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <Card className="w-full max-w-[280px] self-start p-[22px] text-left">
      <div className="mb-2.5 text-[11px] uppercase tracking-wide text-white/40">Convite</div>
      <div className="mb-3.5 text-[15px] font-bold">Entrar em um desafio</div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <Input
          name="code"
          placeholder="A1B2C3"
          maxLength={12}
          className="text-center text-[13px] tracking-[2px] uppercase"
          error={state?.errors?.code?.[0]}
        />
        <p className="text-[10px] text-white/35">Peça o código para quem já participa.</p>

        {state?.message && (
          <p className="text-[11px] text-red-400" role="alert">
            {state.message}
          </p>
        )}
        {state?.success && <p className="text-[11px] text-accent">Você entrou no desafio!</p>}

        <Button type="submit" variant="outline" fullWidth disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
