import type { StreakStatus } from "@/lib/dates";

/** `subject` reads naturally in both "Você perdeu..." (own profile) and "Fulano perdeu..." (viewing someone else's) contexts. */
export function StreakLine({ status, subject = "Você" }: { status: StreakStatus; subject?: string }) {
  if (status.kind === "active") {
    return (
      <div className="mb-2 text-[13px] text-accent">
        🔥 {status.days} {status.days === 1 ? "dia seguido" : "dias seguidos"}
      </div>
    );
  }

  if (status.kind === "lost") {
    return (
      <div className="mb-2 text-[13px] text-red-400">
        {subject} perdeu a sequência. Total de {status.days} {status.days === 1 ? "dia" : "dias"}
      </div>
    );
  }

  return <div className="mb-2 text-[13px] text-white/50">{subject} não tem sequência</div>;
}
