"use client";

import { useActionState, useEffect, useRef } from "react";
import { joinChallenge } from "@/lib/challenges/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function JoinChallengeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(joinChallenge, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
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

      <Button type="submit" variant="outline" fullWidth disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
