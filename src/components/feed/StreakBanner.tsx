import { Card } from "@/components/ui/Card";
import { NewCheckinDialog } from "@/components/checkins/NewCheckinDialog";
import type { ChallengeOption } from "@/lib/challenges/queries";
import type { StreakStatus } from "@/lib/dates";

function StreakLabel({ status }: { status: StreakStatus }) {
  if (status.kind === "active") {
    return (
      <span className="text-sm">
        🔥 {status.days} {status.days === 1 ? "dia seguido" : "dias seguidos"}
      </span>
    );
  }

  if (status.kind === "lost") {
    return (
      <span className="text-sm text-red-400">
        Você perdeu a sequência. Total de {status.days}{" "}
        {status.days === 1 ? "dia" : "dias"}
      </span>
    );
  }

  return <span className="text-sm text-white/50">Você não tem sequência</span>;
}

export function StreakBanner({
  status,
  challenges,
}: {
  status: StreakStatus;
  challenges: ChallengeOption[];
}) {
  return (
    <Card className="mb-9 flex items-center justify-between px-6 py-4">
      <StreakLabel status={status} />
      <NewCheckinDialog
        challenges={challenges}
        label="Manter a sequência"
        variant="primary"
      />
    </Card>
  );
}
