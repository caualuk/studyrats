"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCheckin } from "@/lib/checkins/actions";
import { setInputFile } from "@/lib/fileInput";
import type { ChallengeOption } from "@/lib/challenges/queries";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ImageCropper } from "@/components/ui/ImageCropper";

export function CheckinForm({
  challenges = [],
  lockedChallenge,
  onSuccess,
}: {
  challenges?: ChallengeOption[];
  /** When set, the challenge picker is replaced by a fixed, non-editable target. */
  lockedChallenge?: ChallengeOption;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(createCheckin, undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // No need to also clear `previewUrl` here: on success the parent closes
    // the dialog, which unmounts this component (and its state) entirely.
    if (state?.success) {
      formRef.current?.reset();
      onSuccess();
    }
  }, [state, onSuccess]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="photo">Foto do check-in</Label>
        <label
          htmlFor="photo"
          className="photo-placeholder relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset
            <img src={previewUrl} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <span className="font-mono text-[11px] text-white/45">
              Toque para escolher uma foto
            </span>
          )}
        </label>
        <input
          ref={photoInputRef}
          id="photo"
          name="photo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setCropFile(file);
          }}
        />
      </div>

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
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          placeholder="O que você estudou hoje?"
          error={state?.errors?.title?.[0]}
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Conte um pouco mais..."
          error={state?.errors?.description?.[0]}
        />
      </div>

      {lockedChallenge ? (
        <div>
          <input type="hidden" name="challengeId" value={lockedChallenge.id} />
          <Label>Postando em</Label>
          <p className="text-xs text-accent">{lockedChallenge.name}</p>
        </div>
      ) : (
        challenges.length > 0 && (
          <div>
            <Label htmlFor="challengeId">Postar em um desafio (opcional)</Label>
            <select
              id="challengeId"
              name="challengeId"
              defaultValue=""
              className="w-full rounded-xl border border-border-strong bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-accent"
            >
              <option value="">Feed geral</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )
      )}

      {state?.message && (
        <p className="text-xs text-red-400" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Enviando..." : "Publicar check-in"}
      </Button>
    </form>
  );
}
