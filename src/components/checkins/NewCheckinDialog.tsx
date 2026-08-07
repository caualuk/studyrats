"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { CheckinForm } from "@/components/checkins/CheckinForm";
import type { ChallengeOption } from "@/lib/challenges/queries";

export function NewCheckinDialog({
  challenges = [],
  lockedChallenge,
  label = "Novo check-in",
  variant = "outline",
}: {
  challenges?: ChallengeOption[];
  /** When set, every check-in from this dialog is pinned to this challenge. */
  lockedChallenge?: ChallengeOption;
  label?: string;
  variant?: ButtonProps["variant"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="max-h-[85vh] overflow-y-auto px-6 py-6">
          <h2 className="mb-1 text-lg font-bold">Novo check-in</h2>
          <p className="mb-5 text-xs text-white/45">
            Todo check-in vem com foto. Sem foto, não conta.
          </p>
          <CheckinForm
            challenges={challenges}
            lockedChallenge={lockedChallenge}
            onSuccess={() => setOpen(false)}
          />
        </Card>
      </Modal>
    </>
  );
}
