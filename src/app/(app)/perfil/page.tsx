import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getUserCheckins, getUserStudyDays } from "@/lib/checkins/queries";
import { getMyFriends } from "@/lib/friends/queries";
import { calculateLongestStreak, countActiveDays, getStreakStatus } from "@/lib/dates";
import { ProfileHeader } from "@/components/perfil/ProfileHeader";
import { ProfileActivity } from "@/components/perfil/ProfileActivity";
import { FriendsSection } from "@/components/perfil/FriendsSection";
import { StatsGrid } from "@/components/stats/StatsGrid";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await getCurrentUser();
  const [checkins, studyDays, friends] = await Promise.all([
    getUserCheckins(user.id),
    getUserStudyDays(user.id),
    getMyFriends(user.id),
  ]);

  const now = new Date();
  const streakStatus = getStreakStatus(studyDays);
  const activeDaysThisMonth = countActiveDays(
    studyDays.filter(
      (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    )
  );

  return (
    <div className="mx-auto max-w-[920px] px-6 pb-20 pt-14">
      <ProfileHeader
        name={user.name}
        username={user.username}
        avatarUrl={user.avatarUrl}
        bio={user.bio}
        streakStatus={streakStatus}
      />

      <div className="mx-auto max-w-[560px]">
        <StatsGrid
          className="mb-8"
          size="sm"
          stats={[
            { value: checkins.length, label: "Check-ins" },
            { value: countActiveDays(studyDays), label: "Dias ativos" },
            { value: calculateLongestStreak(studyDays), label: "Recorde seguido" },
            { value: activeDaysThisMonth, label: "Este mês" },
          ]}
        />
      </div>

      <ProfileActivity checkins={checkins} />
      <FriendsSection friends={friends} />
    </div>
  );
}
