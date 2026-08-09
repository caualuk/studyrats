"use client";

import { useActionState, useState } from "react";
import { updatePrivacy } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export function PrivacyForm({ isPrivate }: { isPrivate: boolean }) {
  const [state, formAction, pending] = useActionState(updatePrivacy, undefined);
  const [privateProfile, setPrivateProfile] = useState(isPrivate);

  return (
    <Card className="p-5 text-left">
      <form action={formAction} className="flex flex-col gap-2.5">
        <Label>Privacidade do perfil</Label>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-pressed={!privateProfile}
            onClick={() => setPrivateProfile(false)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
              !privateProfile ? "bg-accent text-accent-ink" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            Público
          </button>
          <button
            type="button"
            aria-pressed={privateProfile}
            onClick={() => setPrivateProfile(true)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
              privateProfile ? "bg-accent text-accent-ink" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            Privado
          </button>
        </div>
        <p className="text-[10px] text-white/35">
          {privateProfile
            ? "Só amigos veem suas fotos de check-in e seu calendário. O resto só vê suas estatísticas."
            : "Qualquer pessoa pode ver seu perfil completo, incluindo fotos de check-in e calendário."}
        </p>
        <input type="hidden" name="isPrivate" value={privateProfile ? "on" : ""} />

        {state?.message && (
          <p className="text-[11px] text-red-400" role="alert">
            {state.message}
          </p>
        )}
        {state?.success && <p className="text-[11px] text-accent">Salvo.</p>}

        <Button type="submit" fullWidth disabled={pending} className="mt-1">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}
