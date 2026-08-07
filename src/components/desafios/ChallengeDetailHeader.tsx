import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { NewCheckinDialog } from "@/components/checkins/NewCheckinDialog";
import { EditChallengeDialog } from "@/components/desafios/EditChallengeDialog";
import type { ChallengeDetail } from "@/lib/challenges/queries";

export function ChallengeDetailHeader({ challenge }: { challenge: ChallengeDetail }) {
  return (
    <div>
      <Link href="/desafios" className="mb-4 inline-block text-xs text-white/45 hover:text-white/70">
        ← Desafios
      </Link>

      <PhotoPlaceholder
        src={challenge.coverUrl}
        color={challenge.coverColor}
        alt={challenge.name}
        label="capa do desafio"
        className="mb-5 h-[160px] w-full rounded-2xl"
      />

      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-[32px] font-extrabold">{challenge.name}</h1>
        <div className="flex items-center gap-2">
          <NewCheckinDialog
            lockedChallenge={{ id: challenge.id, name: challenge.name }}
            label="Check-in"
            variant="primary"
          />
          {challenge.canManage && (
            <EditChallengeDialog
              challengeId={challenge.id}
              name={challenge.name}
              coverUrl={challenge.coverUrl}
              coverColor={challenge.coverColor}
            />
          )}
        </div>
      </div>
      {challenge.description && (
        <p className="mb-3 max-w-lg text-sm text-white/55">{challenge.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/45">
        <span>
          👥 {challenge.memberCount} {challenge.memberCount === 1 ? "membro" : "membros"}
        </span>
        <span>código {challenge.code}</span>
        {challenge.daysLeft !== null && (
          <span className="text-accent">
            {challenge.daysLeft > 0 ? `${challenge.daysLeft} dias restantes` : "Encerrado"}
          </span>
        )}
        {challenge.isOwner && <span className="text-accent">Você é o dono</span>}
        {!challenge.isOwner && challenge.isAdmin && (
          <span className="text-accent">Você é admin</span>
        )}
      </div>
    </div>
  );
}
