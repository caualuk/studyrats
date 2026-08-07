"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { checkOutCheckin } from "@/lib/checkins/actions";
import { setInputFile } from "@/lib/fileInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

/** Finishes an in-progress check-in: title, description, and the proof photo -- open from the Feed banner's "Finalizar check-out". */
export function CheckOutDialog({
  checkinId,
  open,
  onClose,
}: {
  checkinId: string;
  open: boolean;
  onClose: () => void;
}) {
  const checkOutThisCheckin = checkOutCheckin.bind(null, checkinId);
  const [state, formAction, pending] = useActionState(checkOutThisCheckin, undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
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

  return (
    <Modal open={open} onClose={onClose}>
      <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
        <h2 className="mb-1 text-lg font-bold">Finalizar check-in</h2>
        <p className="mb-5 text-xs text-white/45">Todo check-in vem com foto. Sem foto, não conta.</p>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
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
