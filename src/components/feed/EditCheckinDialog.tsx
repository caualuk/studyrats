"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { editCheckin } from "@/lib/checkins/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { FeedCheckin } from "@/lib/checkins/queries";

export function EditCheckinDialog({
  checkin,
  open,
  onClose,
}: {
  checkin: FeedCheckin;
  open: boolean;
  onClose: () => void;
}) {
  const editThisCheckin = editCheckin.bind(null, checkin.id);
  const [state, formAction, pending] = useActionState(editThisCheckin, undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Modal open={open} onClose={onClose}>
      <Card className="px-6 py-6 text-left">
        <h2 className="mb-4 text-lg font-bold">Editar check-in</h2>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <label
            htmlFor="edit-photo"
            className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={previewUrl} alt="Pré-visualização" className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- current photo thumbnail
              <img src={checkin.photoUrl} alt={checkin.title} className="h-full w-full object-cover" />
            )}
          </label>
          <input
            id="edit-photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
          />

          <div>
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={checkin.title}
              error={state?.errors?.title?.[0]}
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Descrição (opcional)</Label>
            <Textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={checkin.description ?? ""}
              error={state?.errors?.description?.[0]}
            />
          </div>

          {state?.message && (
            <p className="text-xs text-red-400" role="alert">
              {state.message}
            </p>
          )}

          <Button type="submit" fullWidth disabled={pending}>
            {pending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Card>
    </Modal>
  );
}
