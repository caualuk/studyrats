"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createChallenge } from "@/lib/challenges/actions";
import { CHALLENGE_COVER_COLORS } from "@/lib/challenges/coverColors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { WEEKDAY_LABELS_PT } from "@/lib/dates";

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export function CreateChallengeForm() {
  const [state, formAction, pending] = useActionState(createChallenge, undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coverColor, setCoverColor] = useState<string | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [isPublic, setIsPublic] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // This form stays mounted after a successful submit (unlike the check-in
  // dialog, which closes), so it needs to actively clear itself.
  //
  // The native inputs are reset as a DOM side effect (not a state update),
  // so that part belongs in an effect. Clearing `previewUrl` *is* a state
  // update, so instead of doing it inside the effect we follow React's
  // "adjust state during render" pattern: compare against the previous
  // `state` value on every render and update synchronously when it changes.
  // See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) {
      setPreviewUrl(null);
      setCoverColor(null);
      setWeekdays(ALL_WEEKDAYS);
      setIsPublic(false);
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Card className="w-full max-w-[280px] p-[22px] text-left">
      <div className="mb-2.5 text-[11px] uppercase tracking-wide text-white/40">Novo</div>
      <div className="mb-1.5 text-[15px] font-bold">Criar desafio</div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-2.5">
        <label
          htmlFor="cover"
          className="photo-placeholder relative flex h-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong text-center"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={previewUrl} alt="Capa do desafio" className="h-full w-full object-cover" />
          ) : coverColor ? (
            <div className="absolute inset-0" style={{ backgroundColor: coverColor }} />
          ) : (
            <>
              <span className="mb-1 text-[11px] text-white/50">Capa do desafio</span>
              <span className="px-3 text-[10px] text-white/35">
                Opcional. Toque para escolher uma imagem.
              </span>
            </>
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
            if (file) setCoverColor(null);
          }}
        />
        <input type="hidden" name="coverColor" value={coverColor ?? ""} />

        {!previewUrl && (
          <div className="flex items-center gap-1.5">
            <span className="mr-0.5 text-[10px] text-white/35">Ou uma cor:</span>
            {CHALLENGE_COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Usar ${color} como capa`}
                aria-pressed={coverColor === color}
                onClick={() => setCoverColor((current) => (current === color ? null : color))}
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2 transition-transform",
                  coverColor === color
                    ? "scale-110 border-white"
                    : "border-transparent hover:scale-110"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        <Input
          name="name"
          placeholder="Nome do desafio"
          error={state?.errors?.name?.[0]}
        />
        <Textarea
          name="description"
          rows={2}
          placeholder="Descrição (opcional)"
          error={state?.errors?.description?.[0]}
        />

        <div>
          <Label htmlFor="startDate">Começa em (opcional)</Label>
          <Input id="startDate" name="startDate" type="date" error={state?.errors?.startDate?.[0]} />
        </div>
        <div>
          <Label htmlFor="endDate">Termina em (opcional)</Label>
          <Input id="endDate" name="endDate" type="date" error={state?.errors?.endDate?.[0]} />
        </div>

        <div>
          <Label>Vale nos dias</Label>
          <div className="flex gap-1">
            {WEEKDAY_LABELS_PT.map((label, day) => (
              <button
                key={day}
                type="button"
                aria-pressed={weekdays.includes(day)}
                aria-label={`Alternar ${label}`}
                onClick={() =>
                  setWeekdays((current) =>
                    current.includes(day)
                      ? current.filter((d) => d !== day)
                      : [...current, day].sort()
                  )
                }
                className={cn(
                  "h-7 w-7 shrink-0 rounded-full text-[11px] font-bold transition-colors",
                  weekdays.includes(day)
                    ? "bg-accent text-accent-ink"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {weekdays.map((day) => (
            <input key={day} type="hidden" name="weekdays" value={day} />
          ))}
          {state?.errors?.weekdays?.[0] && (
            <p className="mt-1.5 text-[11px] text-red-400">{state.errors.weekdays[0]}</p>
          )}
        </div>

        <div>
          <Label>Visibilidade</Label>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-pressed={!isPublic}
              onClick={() => setIsPublic(false)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                !isPublic ? "bg-accent text-accent-ink" : "bg-white/5 text-white/40 hover:bg-white/10"
              )}
            >
              Privado
            </button>
            <button
              type="button"
              aria-pressed={isPublic}
              onClick={() => setIsPublic(true)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                isPublic ? "bg-accent text-accent-ink" : "bg-white/5 text-white/40 hover:bg-white/10"
              )}
            >
              Público
            </button>
          </div>
          <p className="mt-1 text-[10px] text-white/35">
            {isPublic
              ? "O código de convite fica visível pra qualquer membro."
              : "O código de convite fica visível só pra você (dono/admins)."}
          </p>
          <input type="hidden" name="isPublic" value={isPublic ? "on" : ""} />
        </div>

        {state?.message && (
          <p className="text-[11px] text-red-400" role="alert">
            {state.message}
          </p>
        )}
        {state?.success && (
          <p className="text-[11px] text-accent">Desafio criado! Veja abaixo em &ldquo;Meus desafios&rdquo;.</p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Criando..." : "Criar desafio"}
        </Button>
      </form>
    </Card>
  );
}
