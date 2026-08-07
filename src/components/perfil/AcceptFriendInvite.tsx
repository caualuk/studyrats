"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { acceptFriendInvite, type AcceptInviteResult } from "@/lib/friends/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

const BUTTON_CLASSES =
  "inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-[13px] font-bold text-accent-ink transition-colors hover:bg-accent-hover";

export function AcceptFriendInvite({
  code,
  me,
}: {
  code: string;
  me: { name: string; avatarUrl: string | null };
}) {
  const [result, setResult] = useState<AcceptInviteResult | "loading">("loading");
  // Guards against React Strict Mode's dev-only double-invoke of effects:
  // without this, the invite gets accepted twice in quick succession and
  // the *second* (idempotent "already_friends") response can overwrite the
  // first ("success") one in state, showing the wrong message even though
  // the underlying data is correct. Tracks the code itself (not just a
  // boolean) so a real navigation to a different invite still re-runs.
  //
  // Deliberately no "cancelled" cleanup flag here: Strict Mode's synthetic
  // unmount would flip it on the *surviving* effect's promise chain too
  // (both invocations close over the same ref), which silently drops the
  // one setResult call that would have actually reached the DOM -- the
  // dialog would look stuck on "Processando convite..." forever.
  const processedCode = useRef<string | null>(null);

  useEffect(() => {
    if (processedCode.current === code) return;
    processedCode.current = code;
    acceptFriendInvite(code).then(setResult);
  }, [code]);

  if (result === "loading") {
    return <p className="text-sm text-white/45">Processando convite...</p>;
  }

  if (result.status === "invalid") {
    return (
      <Card className="w-full max-w-sm px-6 py-8 text-center">
        <h1 className="mb-2 text-lg font-bold">Convite inválido.</h1>
        <p className="mb-6 text-xs text-white/45">Esse link não existe ou não é mais válido.</p>
        <Link href="/perfil" className={BUTTON_CLASSES}>
          Ir para o perfil
        </Link>
      </Card>
    );
  }

  if (result.status === "self") {
    return (
      <Card className="w-full max-w-sm px-6 py-8 text-center">
        <h1 className="mb-2 text-lg font-bold">Esse é o seu link.</h1>
        <p className="mb-6 text-xs text-white/45">
          Compartilhe esse convite com outra pessoa para virarem amigos.
        </p>
        <Link href="/perfil" className={BUTTON_CLASSES}>
          Ir para o perfil
        </Link>
      </Card>
    );
  }

  const { friend } = result;
  const title =
    result.status === "success"
      ? `Agora você e ${friend.name} são amigos!`
      : `Você e ${friend.name} já são amigos.`;

  return (
    <Card className="w-full max-w-sm px-6 py-8 text-center">
      <div className="mb-5 flex items-center justify-center">
        <Avatar src={me.avatarUrl} name={me.name} size="xl" className="border-4 border-bg" />
        <Avatar
          src={friend.avatarUrl}
          name={friend.name}
          size="xl"
          className="-ml-5 border-4 border-bg"
        />
      </div>
      <h1 className="mb-6 text-lg font-bold">{title}</h1>
      <Link href="/perfil" className={BUTTON_CLASSES}>
        Ir para o perfil
      </Link>
    </Card>
  );
}
