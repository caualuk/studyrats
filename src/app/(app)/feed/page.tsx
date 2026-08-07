import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getFeedCheckins, getUserStudyDays } from "@/lib/checkins/queries";
import { getMyChallengeOptions } from "@/lib/challenges/queries";
import { getStreakStatus } from "@/lib/dates";
import { CheckinCard } from "@/components/feed/CheckinCard";
import { StreakBanner } from "@/components/feed/StreakBanner";
import { NewCheckinDialog } from "@/components/checkins/NewCheckinDialog";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const user = await getCurrentUser();
  const [checkins, studyDays, challenges] = await Promise.all([
    getFeedCheckins(user.id),
    getUserStudyDays(user.id),
    getMyChallengeOptions(user.id),
  ]);
  const streakStatus = getStreakStatus(studyDays);

  return (
    <div className="mx-auto max-w-[920px] px-6 pb-20 pt-14">
      <h1 className="mb-2 text-center text-[42px] font-extrabold">Feed.</h1>
      <p className="mb-6 text-center text-sm text-white/50">
        Todo check-in vem com foto. Sem foto, não conta.
      </p>

      <div className="mb-8 flex justify-center">
        <NewCheckinDialog challenges={challenges} />
      </div>

      <StreakBanner status={streakStatus} challenges={challenges} />

      <h2 className="mb-[18px] text-xl font-bold">Últimos check-ins.</h2>

      {checkins.length === 0 ? (
        <EmptyState
          title="Ainda não rolou nenhum check-in."
          description="Seja o primeiro a postar um check-in e mostrar no que está estudando."
        />
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {checkins.map((checkin) => (
            <CheckinCard key={checkin.id} checkin={checkin} />
          ))}
        </div>
      )}
    </div>
  );
}
