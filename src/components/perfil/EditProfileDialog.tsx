"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const BIO_MAX_LENGTH = 150;

export function EditProfileDialog({
  name,
  username,
  bio,
}: {
  name: string;
  username: string;
  bio: string | null;
}) {
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
        <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
          <h2 className="mb-4 text-lg font-bold">Editar perfil</h2>
          <EditProfileForm name={name} username={username} bio={bio} onSaved={() => setOpen(false)} />
        </Card>
      </Modal>
    </>
  );
}

export function EditProfileForm({
  name,
  username,
  bio,
  onSaved,
}: {
  name: string;
  username: string;
  bio: string | null;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);
  const [length, setLength] = useState(bio?.length ?? 0);

  // Notifying the parent (closing the dialog) is a side effect on an
  // external component, not this component's own state, so -- unlike the
  // local-state adjustments elsewhere in the app -- it belongs in an
  // effect rather than in the render body.
  useEffect(() => {
    if (state?.success) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={name} error={state?.errors?.name?.[0]} />
      </div>

      <div>
        <Label htmlFor="username">Usuário</Label>
        <Input id="username" name="username" defaultValue={username} error={state?.errors?.username?.[0]} />
      </div>

      <div>
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
        <span className="mt-1 block text-right text-[10px] text-white/35">
          {length}/{BIO_MAX_LENGTH}
        </span>
      </div>

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
