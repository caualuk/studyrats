"use client";

import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { checkOutCheckin } from "@/lib/checkins/actions";
import { setInputFile } from "@/lib/fileInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { ChallengeOption } from "@/lib/challenges/queries";
import type { ActiveCheckin } from "@/lib/checkins/queries";
import type { FormState } from "@/lib/validations";

/**
 * Finishes an in-progress check-in: title, description, the proof photo,
 * and which challenges (zero or more) to post it under -- open from the
 * Feed banner's "Finalizar check-out". On success, hands the elapsed time
 * back via `onCheckedOut` (for the success modal) instead of showing one
 * itself, since that modal needs to survive this dialog's parent unmounting
 * once the check-in is no longer "active" -- see StreakBanner.
 *
 * Deliberately not built on useActionState: its success handling runs in an
 * effect *after* the state update commits, and the checkOutCheckin action's
 * own revalidatePath can cause this dialog's parent (ActiveSession) to
 * unmount -- once activeCheckin flips to null -- before that effect gets a
 * chance to run, silently dropping the success callback despite the
 * check-in having saved correctly. Calling the action directly and firing
 * the callback right after awaiting it sidesteps that race.
 */
export function CheckOutDialog({
  checkin,
  challenges,
  open,
  onClose,
  onCheckedOut,
}: {
  checkin: ActiveCheckin;
  challenges: ChallengeOption[];
  open: boolean;
  onClose: () => void;
  onCheckedOut: (elapsedMs: number) => void;
}) {
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<string[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await checkOutCheckin(checkin.id, undefined, formData);
      if (result?.success) {
        // Net study time: total wall time minus any paused stretches,
        // including one still open if checkout happens mid-pause -- mirrors
        // what checkOutCheckin itself folds into pausedMs server-side.
        const openPauseMs = checkin.pausedAt ? Date.now() - checkin.pausedAt.getTime() : 0;
        onCheckedOut(Date.now() - checkin.createdAt.getTime() - checkin.pausedMs - openPauseMs);
        onClose();
        return;
      }
      setState(result);
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        onClose();
      }}
    >
      <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
        <h2 className="mb-1 text-lg font-bold">Finalizar check-in</h2>
        <p className="mb-5 text-xs text-white/45">Todo check-in vem com foto. Sem foto, não conta.</p>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label
            htmlFor="checkout-photo"
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
            id="checkout-photo"
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
            <Label htmlFor="checkout-title">Título</Label>
            <Input
              id="checkout-title"
              name="title"
              placeholder="O que você estudou?"
              error={state?.errors?.title?.[0]}
            />
          </div>

          <div>
            <Label htmlFor="checkout-description">Descrição (opcional)</Label>
            <Textarea
              id="checkout-description"
              name="description"
              rows={3}
              placeholder="Conte um pouco mais..."
              error={state?.errors?.description?.[0]}
            />
          </div>

          {challenges.length > 0 && (
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

          <div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-strong bg-white/5 px-3 py-2.5 text-xs text-white/70">
              <input
                type="checkbox"
                name="answeredQuestions"
                checked={answeredQuestions}
                onChange={(event) => setAnsweredQuestions(event.target.checked)}
                className="accent-accent"
              />
              Respondeu questões nesse check-in?
            </label>

            {answeredQuestions && (
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div>
                  <Label htmlFor="checkout-questions-total">Quantas respondeu</Label>
                  <Input
                    id="checkout-questions-total"
                    name="questionsTotal"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="0"
                    error={state?.errors?.questionsTotal?.[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-questions-correct">Quantas acertou</Label>
                  <Input
                    id="checkout-questions-correct"
                    name="questionsCorrect"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    error={state?.errors?.questionsCorrect?.[0]}
                  />
                </div>
              </div>
            )}
          </div>

          {state?.message && (
            <p className="text-xs text-red-400" role="alert">
              {state.message}
            </p>
          )}

          <Button type="submit" fullWidth disabled={pending}>
            {pending ? "Enviando..." : "Finalizar check-out"}
          </Button>
        </form>
      </Card>
    </Modal>
  );
}
