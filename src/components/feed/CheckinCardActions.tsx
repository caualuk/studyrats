"use client";

import { useState, useTransition } from "react";
import type { MouseEvent } from "react";
import { deleteCheckin } from "@/lib/checkins/actions";
import { EditCheckinDialog } from "@/components/feed/EditCheckinDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { FeedCheckin } from "@/lib/checkins/queries";

const ICON_BUTTON_CLASSES =
  "flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/85 opacity-0 outline-none transition-opacity hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100";

/**
 * Trash (top) and pencil (below it) icons overlaid on the check-in photo,
 * top-right, shown on hover of the card (parent needs `group`). Trash is
 * gated on `canDelete` -- the author, or an owner/admin of the challenge
 * moderating an offensive post from another member. Pencil (editing the
 * content itself) stays author-only regardless.
 */
export function CheckinCardActions({ checkin }: { checkin: FeedCheckin }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function stop(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCheckin(checkin.id);
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
        {checkin.canDelete && (
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setConfirmOpen(true);
            }}
            aria-label="Excluir check-in"
            title="Excluir"
            className={ICON_BUTTON_CLASSES}
          >
            <TrashIcon />
          </button>
        )}
        {checkin.isOwner && (
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setEditOpen(true);
            }}
            aria-label="Editar check-in"
            title="Editar"
            className={ICON_BUTTON_CLASSES}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {checkin.isOwner && (
        <EditCheckinDialog checkin={checkin} open={editOpen} onClose={() => setEditOpen(false)} />
      )}

      {checkin.canDelete && (
        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <Card className="px-6 py-6 text-left">
            <h2 className="mb-2 text-lg font-bold">Excluir check-in?</h2>
            <p className="mb-1 text-sm text-white/60">
              Essa ação não pode ser desfeita. A foto e os comentários somem junto.
            </p>
            {!checkin.isOwner && (
              <p className="mb-1 text-xs text-white/40">
                Você está removendo como admin do desafio.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="bg-red-500 text-white hover:bg-red-600 disabled:hover:bg-red-500"
              >
                {isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </Card>
        </Modal>
      )}
    </>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[15px] w-[15px]")}
    >
      <path d="M4 5.5h12" />
      <path d="M7.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
      <path d="M5.5 5.5 6 15a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 14 15l.5-9.5" />
      <path d="M8.3 8.5v4.3" />
      <path d="M11.7 8.5v4.3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
    >
      <path d="M12.7 3.8a1.5 1.5 0 0 1 2.1 2.1L6 14.7l-2.8.7.7-2.8Z" />
      <path d="M11.3 5.2 14.8 8.7" />
    </svg>
  );
}
