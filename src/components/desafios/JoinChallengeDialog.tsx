"use client";

import { useState } from "react";
import { JoinChallengeForm } from "@/components/desafios/JoinChallengeForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export function JoinChallengeDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Entrar em um desafio
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
          <h2 className="mb-4 text-lg font-bold">Entrar em um desafio</h2>
          <JoinChallengeForm onSuccess={() => setOpen(false)} />
        </Card>
      </Modal>
    </>
  );
}
