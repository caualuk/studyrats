"use client";

import { useState } from "react";
import { getOrCreateInviteCode } from "@/lib/friends/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export function AddFriendDialog() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleOpen() {
    setOpen(true);
    setCopied(false);
    if (link) return;
    setLoading(true);
    try {
      const code = await getOrCreateInviteCode();
      setLink(`${window.location.origin}/amigos/${code}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        Adicionar amigos
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Card className="max-h-[85vh] overflow-y-auto px-6 py-6 text-left">
          <h2 className="mb-1 text-lg font-bold">Adicionar amigos</h2>
          <p className="mb-4 text-xs text-white/45">
            Envie esse link para alguém. Quando a pessoa abrir e estiver logada, vocês
            viram amigos automaticamente.
          </p>

          {loading || !link ? (
            <p className="text-xs text-white/40">Gerando link...</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              <input
                readOnly
                value={link}
                onFocus={(event) => event.target.select()}
                className="w-full rounded-xl border border-border-strong bg-white/5 px-3 py-2.5 text-xs text-white outline-none"
              />
              <Button type="button" fullWidth onClick={handleCopy}>
                {copied ? "Link copiado!" : "Copiar link"}
              </Button>
            </div>
          )}
        </Card>
      </Modal>
    </>
  );
}
