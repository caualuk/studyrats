"use client";

import { useActionState, useEffect, useState } from "react";
import { updateBio } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const BIO_MAX_LENGTH = 150;

export function EditProfileDialog({ bio }: { bio: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs text-white/50 transition-colors hover:text-white"
      >
        Editar perfil
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="px-6 py-6 text-left">
          <h2 className="mb-4 text-lg font-bold">Editar perfil</h2>
          <EditProfileForm bio={bio} onSaved={() => setOpen(false)} />
        </Card>
      </Modal>
    </>
  );
}

function EditProfileForm({ bio, onSaved }: { bio: string | null; onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(updateBio, undefined);
  const [length, setLength] = useState(bio?.length ?? 0);

  // Notifying the parent (closing the dialog) is a side effect on an
  // external component, not this component's own state, so -- unlike the
  // local-state adjustments elsewhere in the app -- it belongs in an
  // effect rather than in the render body.
  useEffect(() => {
    if (state?.success) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        name="bio"
        rows={3}
        maxLength={BIO_MAX_LENGTH}
        defaultValue={bio ?? ""}
        placeholder="Conte um pouco sobre você e o que está estudando..."
        error={state?.errors?.bio?.[0]}
        onChange={(event) => setLength(event.target.value.length)}
      />
      <span className="self-end text-[10px] text-white/35">
        {length}/{BIO_MAX_LENGTH}
      </span>

      {state?.message && (
        <p className="text-[11px] text-red-400" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
