import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import type { MyChallengeCard } from "@/lib/challenges/queries";

export function ChallengeCard({ challenge }: { challenge: MyChallengeCard }) {
  return (
    <Link href={`/desafios/${challenge.id}`}>
      <Card className="overflow-hidden text-left transition-colors hover:border-border-strong">
        <PhotoPlaceholder
          src={challenge.coverUrl}
          color={challenge.coverColor}
          alt={challenge.name}
          label="capa do desafio"
          className="h-[120px] w-full"
        />
        <div className="px-4 py-3.5">
          <div className="mb-1.5 text-sm font-bold">{challenge.name}</div>
          <div className="flex justify-between text-[11px] text-white/45">
            <span>
              👥 {challenge.memberCount} {challenge.memberCount === 1 ? "membro" : "membros"} ·
              código {challenge.code}
            </span>
            {challenge.daysLeft !== null && (
              <span className="shrink-0 text-accent">
                {challenge.daysLeft > 0 ? `${challenge.daysLeft} dias restantes` : "Encerrado"}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
