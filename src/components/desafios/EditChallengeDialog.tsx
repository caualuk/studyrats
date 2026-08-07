"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateChallenge } from "@/lib/challenges/actions";
import { CHALLENGE_COVER_COLORS } from "@/lib/challenges/coverColors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

export function EditChallengeDialog({
  challengeId,
  name,
  coverUrl,
  coverColor,
}: {
  challengeId: string;
  name: string;
  coverUrl: string | null;
  coverColor: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Editar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="px-6 py-6 text-left">
          <h2 className="mb-4 text-lg font-bold">Editar desafio</h2>
          <EditChallengeForm
            challengeId={challengeId}
            name={name}
            coverUrl={coverUrl}
            coverColor={coverColor}
            onSaved={() => setOpen(false)}
          />
        </Card>
      </Modal>
    </>
  );
}

function EditChallengeForm({
  challengeId,
  name,
  coverUrl,
  coverColor,
  onSaved,
}: {
  challengeId: string;
  name: string;
  coverUrl: string | null;
  coverColor: string | null;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateChallenge, undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(coverColor);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state, onSaved]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="challengeId" value={challengeId} />

      <label
        htmlFor="cover"
        className="photo-placeholder relative flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={previewUrl} alt="Capa do desafio" className="h-full w-full object-cover" />
        ) : selectedColor ? (
          <div className="absolute inset-0" style={{ backgroundColor: selectedColor }} />
        ) : coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- small edit-dialog thumbnail
          <img src={coverUrl} alt="Capa do desafio" className="h-full w-full object-cover" />
        ) : (
          <span className="px-3 text-[11px] text-white/50">Toque para escolher uma imagem</span>
        )}
      </label>
      <input
        id="cover"
        name="cover"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreviewUrl(file ? URL.createObjectURL(file) : null);
          if (file) setSelectedColor(null);
        }}
      />
      <input type="hidden" name="coverColor" value={selectedColor ?? ""} />

      {!previewUrl && (
        <div className="flex items-center gap-1.5">
          <span className="mr-0.5 text-[10px] text-white/35">Ou uma cor:</span>
          {CHALLENGE_COVER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Usar ${color} como capa`}
              aria-pressed={selectedColor === color}
              onClick={() => setSelectedColor((current) => (current === color ? null : color))}
              className={cn(
                "h-5 w-5 shrink-0 rounded-full border-2 transition-transform",
                selectedColor === color
                  ? "scale-110 border-white"
                  : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      <div>
        <Label htmlFor="name">Nome do desafio</Label>
        <Input id="name" name="name" defaultValue={name} error={state?.errors?.name?.[0]} />
      </div>

      {state?.message && (
        <p className="text-[11px] text-red-400" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
