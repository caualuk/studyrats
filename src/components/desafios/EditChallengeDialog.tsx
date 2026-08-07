"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteChallenge, updateChallenge } from "@/lib/challenges/actions";
import { CHALLENGE_COVER_COLORS } from "@/lib/challenges/coverColors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toDateKey } from "@/lib/dates";
import { cn } from "@/lib/cn";

export function EditChallengeDialog({
  challengeId,
  name,
  description,
  coverUrl,
  coverColor,
  startDate,
  endDate,
  isOwner,
}: {
  challengeId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  coverColor: string | null;
  startDate: Date;
  endDate: Date | null;
  /** Only the owner can delete the challenge -- see deleteChallenge. */
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Editar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
          <h2 className="mb-4 text-lg font-bold">Editar desafio</h2>
          <EditChallengeForm
            challengeId={challengeId}
            name={name}
            description={description}
            coverUrl={coverUrl}
            coverColor={coverColor}
            startDate={startDate}
            endDate={endDate}
            onSaved={() => setOpen(false)}
          />
          {isOwner && <DeleteChallengeSection challengeId={challengeId} />}
        </Card>
      </Modal>
    </>
  );
}

function EditChallengeForm({
  challengeId,
  name,
  description,
  coverUrl,
  coverColor,
  startDate,
  endDate,
  onSaved,
}: {
  challengeId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  coverColor: string | null;
  startDate: Date;
  endDate: Date | null;
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

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={description ?? ""}
          error={state?.errors?.description?.[0]}
        />
      </div>

      <div>
        <Label htmlFor="startDate">Começa em</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={toDateKey(startDate)}
          error={state?.errors?.startDate?.[0]}
        />
      </div>
      <div>
        <Label htmlFor="endDate">Termina em (opcional)</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={endDate ? toDateKey(endDate) : ""}
          error={state?.errors?.endDate?.[0]}
        />
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

function DeleteChallengeSection({ challengeId }: { challengeId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteChallenge(challengeId);
      // Only returns on failure -- success redirects away from this page entirely.
      if (result?.message) setMessage(result.message);
    });
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-[11px] text-red-400/70 transition-colors hover:text-red-400"
        >
          Excluir desafio
        </button>
      ) : (
        <div>
          <p className="mb-2 text-[11px] text-white/60">
            Excluir <strong>apaga o desafio pra todo mundo</strong>. Os check-ins já feitos
            continuam existindo, só deixam de ficar vinculados a ele. Essa ação não pode ser
            desfeita.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-500 text-white hover:bg-red-600 disabled:hover:bg-red-500"
            >
              {isPending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </div>
          {message && (
            <p className="mt-2 text-[11px] text-red-400" role="alert">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
