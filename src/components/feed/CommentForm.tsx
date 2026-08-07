"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment } from "@/lib/comments/actions";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export function CommentForm({
  checkinId,
  onPosted,
}: {
  checkinId: string;
  onPosted: () => void;
}) {
  const postComment = createComment.bind(null, checkinId);
  const [state, formAction, pending] = useActionState(postComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onPosted();
    }
  }, [state, onPosted]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Textarea
        name="content"
        rows={2}
        placeholder="Escreva um comentário..."
        error={state?.errors?.content?.[0]}
      />
      {state?.message && (
        <p className="text-[11px] text-red-400" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "Publicando..." : "Comentar"}
      </Button>
    </form>
  );
}
