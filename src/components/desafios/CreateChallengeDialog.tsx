"use client";

import { useState } from "react";
import { CreateChallengeForm } from "@/components/desafios/CreateChallengeForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export function CreateChallengeDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Criar desafio</Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
          <h2 className="mb-4 text-lg font-bold">Criar desafio</h2>
          <CreateChallengeForm onSuccess={() => setOpen(false)} />
        </Card>
      </Modal>
    </>
  );
}
