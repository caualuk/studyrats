"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateAvatar } from "@/lib/users/actions";
import { Avatar } from "@/components/ui/Avatar";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { setInputFile } from "@/lib/fileInput";

export function AvatarUploader({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(updateAvatar, undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Once the upload succeeds, the parent Server Component re-fetches the
  // user and passes down the real `avatarUrl` -- drop the local blob
  // preview so we show that instead. Done during render (comparing against
  // the previous `state`) rather than in an effect, since this *is* a
  // state update and effects shouldn't synchronously call setState.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setPreviewUrl(null);
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="mx-auto mb-5 flex flex-col items-center gap-2">
      <form ref={formRef} action={formAction}>
        <label
          htmlFor="avatar"
          className="group relative block h-[88px] w-[88px] cursor-pointer overflow-hidden rounded-full"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Avatar src={avatarUrl} name={name} size="xl" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-center text-[10px] font-semibold text-transparent transition-colors group-hover:bg-black/55 group-hover:text-white">
            {pending ? "Enviando..." : "Trocar foto"}
          </span>
        </label>
        <input
          ref={avatarInputRef}
          id="avatar"
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setCropFile(file);
          }}
        />
      </form>

      <ImageCropper
        key={cropFile ? `${cropFile.name}-${cropFile.lastModified}-${cropFile.size}` : "empty"}
        file={cropFile}
        open={cropFile !== null}
        outputWidth={512}
        outputHeight={512}
        shape="circle"
        onCancel={() => {
          setCropFile(null);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
        }}
        onConfirm={(blob) => {
          const cropped = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          if (avatarInputRef.current) setInputFile(avatarInputRef.current, cropped);
          setPreviewUrl(URL.createObjectURL(cropped));
          setCropFile(null);
          formRef.current?.requestSubmit();
        }}
      />

      {state?.message && (
        <p className="text-[11px] text-red-400" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
