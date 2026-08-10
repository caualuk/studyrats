"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function EditProfileDialog({
  name,
  username,
}: {
  name: string;
  username: string;
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
          <EditProfileForm name={name} username={username} onSaved={() => setOpen(false)} />
        </Card>
      </Modal>
    </>
  );
}

export function EditProfileForm({
  name,
  username,
  onSaved,
}: {
  name: string;
  username: string;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

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
