import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getProfileByUsername } from "@/lib/users/queries";
import { getStudyHoursThisMonth, getUserCheckins, getUserStudyDays } from "@/lib/checkins/queries";
import { calculateLongestStreak, countActiveDays, getStreakStatus } from "@/lib/dates";
import { Avatar } from "@/components/ui/Avatar";
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
 * editable /perfil instead. Only visible to friends of that user (see
 * getProfileByUsername); anyone else gets the same 404 as a nonexistent
 * username.
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

  const [checkins, studyDays, hoursThisMonth] = await Promise.all([
    getUserCheckins(profile.id, currentUser.id),
    getUserStudyDays(profile.id),
    getStudyHoursThisMonth(profile.id),
  ]);

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
        <StreakLine status={streakStatus} subject={profile.name.split(" ")[0]} />
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
            { value: checkins.length, label: "Check-ins" },
            { value: countActiveDays(studyDays), label: "Dias ativos" },
            { value: calculateLongestStreak(studyDays), label: "Recorde seguido" },
            {
              value: <GrowingNumber value={hoursThisMonth} decimals={1} suffix="h" />,
              label: "Este mês",
            },
          ]}
        />
      </div>

      <ProfileActivity checkins={checkins} />
    </div>
  );
}
