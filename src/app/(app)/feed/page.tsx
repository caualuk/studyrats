import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveCheckin, getFeedCheckins, getUserStudyDays } from "@/lib/checkins/queries";
import { getMyFriends } from "@/lib/friends/queries";
import { getStreakStatus } from "@/lib/dates";
import { CheckinCard } from "@/components/feed/CheckinCard";
import { StreakBanner } from "@/components/feed/StreakBanner";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const user = await getCurrentUser();
  const [checkins, studyDays, activeCheckin, friends] = await Promise.all([
    getFeedCheckins(user.id),
    getUserStudyDays(user.id),
    getActiveCheckin(user.id),
    getMyFriends(user.id),
  ]);
  const streakStatus = getStreakStatus(studyDays);

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <h1 className="mb-2 text-center text-[32px] font-extrabold sm:text-[42px]">Feed.</h1>
      <p className="mb-6 text-center text-sm text-white/50">
        Todo check-in vem com foto. Sem foto, não conta.
      </p>

      <StreakBanner status={streakStatus} activeCheckin={activeCheckin} />

      <h2 className="mb-[18px] text-xl font-bold">Últimos check-ins.</h2>

      {checkins.length === 0 ? (
        friends.length === 0 ? (
          <EmptyState
            title="O feed mostra os check-ins dos seus amigos."
            description={
              <>
                Você ainda não tem amigos por aqui. Adicione alguém no{" "}
                <Link href="/perfil" className="text-accent hover:underline">
                  seu perfil
                </Link>{" "}
                pra começar a ver os check-ins deles aqui.
              </>
            }
          />
        ) : (
          <EmptyState
            title="Nenhum check-in dos seus amigos ainda."
            description="Assim que alguém que você segue postar, aparece aqui."
          />
        )
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
