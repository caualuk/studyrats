"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatElapsed } from "@/lib/dates";

/** Shown right after a check-out finishes -- confirms it went through and shows how long the session ran. */
export function CheckoutSuccessModal({
  elapsedMs,
  onClose,
}: {
  elapsedMs: number;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose}>
      <Card className="px-6 py-8 text-center">
        <div className="mb-2 text-3xl">✅</div>
        <h2 className="mb-1.5 text-lg font-bold">Check-out concluído!</h2>
        <p className="mb-6 text-sm text-white/60">
          Você ficou <span className="font-bold text-accent">{formatElapsed(elapsedMs)}</span>{" "}
          estudando.
        </p>
        <Button fullWidth onClick={onClose}>
          Show de bola
        </Button>
      </Card>
    </Modal>
  );
}
