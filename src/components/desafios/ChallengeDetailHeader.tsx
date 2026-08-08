import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { EditChallengeDialog } from "@/components/desafios/EditChallengeDialog";
import { LeaveChallengeButton } from "@/components/desafios/LeaveChallengeButton";
import { WEEKDAY_SHORT_PT } from "@/lib/dates";
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
        className="mb-5 h-[120px] w-full rounded-2xl sm:h-[160px]"
      />

      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-[26px] font-extrabold sm:text-[32px]">{challenge.name}</h1>
        <div className="flex items-center gap-2">
          {challenge.canManage && (
            <EditChallengeDialog
              challengeId={challenge.id}
              name={challenge.name}
              description={challenge.description}
              coverUrl={challenge.coverUrl}
              coverColor={challenge.coverColor}
              startDate={challenge.startDate}
              endDate={challenge.endDate}
              weekdays={challenge.weekdays}
              isOwner={challenge.isOwner}
            />
          )}
          {!challenge.isOwner && <LeaveChallengeButton challengeId={challenge.id} />}
        </div>
      </div>
      {challenge.description && (
        <p className="mb-3 max-w-lg text-sm text-white/55">{challenge.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/45">
        <span>
          👥 {challenge.memberCount} {challenge.memberCount === 1 ? "membro" : "membros"}
        </span>
        {challenge.weekdays.length < 7 && (
          <span>
            vale {challenge.weekdays.map((d) => WEEKDAY_SHORT_PT[d]).join(", ")}
          </span>
        )}
        {/* Private challenges only reveal the invite code to whoever can manage the challenge (getChallengeDetail already returns null otherwise) -- a regular member has to ask the owner/admin for it instead of being able to pass it along themselves. */}
        {challenge.code && <span>código {challenge.code}</span>}
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
