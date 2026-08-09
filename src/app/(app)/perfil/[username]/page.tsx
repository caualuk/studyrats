import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getProfileByUsername } from "@/lib/users/queries";
import {
  getStudyHoursThisMonth,
  getUserCheckins,
  getUserCheckinsCount,
  getUserStudyDays,
} from "@/lib/checkins/queries";
import { getFriendsCount } from "@/lib/friends/queries";
import { calculateLongestStreak, getStreakStatus } from "@/lib/dates";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { GrowingNumber } from "@/components/checkins/GrowingNumber";
import { ProfileActivity } from "@/components/perfil/ProfileActivity";
import { StreakLine } from "@/components/perfil/StreakLine";
import { StatsGrid } from "@/components/stats/StatsGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

/**
 * Read-only view of another user's profile -- own username redirects to the
 * editable /perfil instead. Every logged-in user can open any profile now
 * (see getProfileByUsername); what changes is how much of it renders:
 * friends and the owner always get the full page, everyone else gets the
 * full page only if the owner hasn't gone private, and otherwise falls back
 * to a stats-only view with no checkin photos or calendar.
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const currentUser = await getCurrentUser();

  const profile = await getProfileByUsername(username, currentUser.id);
  if (!profile) notFound();
  if (profile.id === currentUser.id) redirect("/perfil");

  const [friendsCount, studyDays, hoursThisMonth] = await Promise.all([
    getFriendsCount(profile.id),
    getUserStudyDays(profile.id),
    getStudyHoursThisMonth(profile.id),
  ]);

  const checkins = profile.isFullAccess
    ? await getUserCheckins(profile.id, currentUser.id)
    : null;
  const checkinsCount = checkins ? checkins.length : await getUserCheckinsCount(profile.id);

  const streakStatus = getStreakStatus(studyDays);

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <Link href="/perfil" className="mb-6 inline-block text-xs text-white/45 hover:text-white/70">
        ← Perfil
      </Link>

      <div className="mb-9 text-center">
        <div className="mb-5 flex justify-center">
          <Avatar src={profile.avatarUrl} name={profile.name} size="xl" />
        </div>
        <h1 className="mb-0.5 text-[26px] font-extrabold sm:text-[32px]">{profile.name}</h1>
        <p className="mb-2 text-[13px] text-white/40">@{profile.username}</p>
        {profile.isFullAccess && (
          <StreakLine status={streakStatus} subject={profile.name.split(" ")[0]} />
        )}
        {profile.bio && (
          <p className="mx-auto mb-3 max-w-sm whitespace-pre-line text-[13px] leading-relaxed text-white/60">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-[560px]">
        <StatsGrid
          className="mb-8"
          size="sm"
          stats={[
            { value: checkinsCount, label: "Check-ins" },
            { value: friendsCount, label: "Amigos" },
            { value: calculateLongestStreak(studyDays), label: "Recorde seguido" },
            {
              value: <GrowingNumber value={hoursThisMonth} decimals={1} suffix="h" />,
              label: "Este mês",
            },
          ]}
        />
      </div>

      {profile.isFullAccess ? (
        <ProfileActivity checkins={checkins!} />
      ) : (
        <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <p className="text-sm font-bold text-white">Esse perfil é privado.</p>
          <p className="max-w-sm text-xs text-white/45">
            Só amigos de {profile.name.split(" ")[0]} veem as fotos de check-in e o calendário.
          </p>
        </Card>
      )}
    </div>
  );
}
