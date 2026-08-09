"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { editCheckin } from "@/lib/checkins/actions";
import { getMyChallengeOptions } from "@/lib/challenges/actions";
import { setInputFile } from "@/lib/fileInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { ChallengeOption } from "@/lib/challenges/queries";
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
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [challenges, setChallenges] = useState<ChallengeOption[] | null>(null);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // This dialog stays mounted (just visually hidden) between opens, so its
  // state doesn't reset on its own -- re-sync which challenges are checked
  // every time it opens, in case the check-in's own tags changed since the
  // last time. Adjusted during render (comparing against the previous
  // `open`) rather than in an effect, since this *is* a state update -- see
  // PillTabs for the same pattern.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSelectedChallengeIds(checkin.challenges.map((c) => c.id));
  }

  // Fetching the viewer's challenge list, on the other hand, is exactly
  // what an effect is for: an async call out to an external system.
  useEffect(() => {
    if (!open) return;
    getMyChallengeOptions().then(setChallenges);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
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
            ref={photoInputRef}
            id="edit-photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setCropFile(file);
            }}
          />

          <ImageCropper
            key={cropFile ? `${cropFile.name}-${cropFile.lastModified}-${cropFile.size}` : "empty"}
            file={cropFile}
            open={cropFile !== null}
            onCancel={() => {
              setCropFile(null);
              if (photoInputRef.current) photoInputRef.current.value = "";
            }}
            onConfirm={(blob) => {
              const cropped = new File([blob], "checkin.jpg", { type: "image/jpeg" });
              if (photoInputRef.current) setInputFile(photoInputRef.current, cropped);
              setPreviewUrl(URL.createObjectURL(cropped));
              setCropFile(null);
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

          {challenges && challenges.length > 0 && (
            <div>
              <Label>Marcar em desafios (opcional)</Label>
              <div className="flex flex-col gap-1.5">
                {challenges.map((c) => {
                  const checked = selectedChallengeIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
                        checked
                          ? "border-accent bg-accent/10 text-white"
                          : "border-border-strong bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        name="challengeIds"
                        value={c.id}
                        checked={checked}
                        onChange={(event) =>
                          setSelectedChallengeIds((current) =>
                            event.target.checked
                              ? [...current, c.id]
                              : current.filter((id) => id !== c.id)
                          )
                        }
                        className="accent-accent"
                      />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
