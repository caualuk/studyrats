import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  getStudyHoursThisMonth,
  getUserCheckinsCount,
  getUserCheckinsForMonth,
  getUserCheckinsPage,
  getUserStudyDays,
} from "@/lib/checkins/queries";
import { getFriendsCount } from "@/lib/friends/queries";
import { calculateLongestStreak, getStreakStatus } from "@/lib/dates";
import { GrowingNumber } from "@/components/checkins/GrowingNumber";
import { ProfileHeader } from "@/components/perfil/ProfileHeader";
import { ProfileActivity } from "@/components/perfil/ProfileActivity";
import { StatsGrid } from "@/components/stats/StatsGrid";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const [checkinsPage, calendarCheckins, checkinsCount, studyDays, friendsCount, hoursThisMonth] =
    await Promise.all([
      getUserCheckinsPage(user.id, user.id, undefined, 6),
      getUserCheckinsForMonth(user.id, now.getFullYear(), now.getMonth()),
      getUserCheckinsCount(user.id),
      getUserStudyDays(user.id),
      getFriendsCount(user.id),
      getStudyHoursThisMonth(user.id),
    ]);

  const streakStatus = getStreakStatus(studyDays);

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <ProfileHeader
        name={user.name}
        username={user.username}
        avatarUrl={user.avatarUrl}
        streakStatus={streakStatus}
      />

      <div className="mx-auto max-w-[560px]">
        <StatsGrid
          className="mb-8"
          size="sm"
          stats={[
            { value: checkinsCount, label: "Check-ins" },
            { value: friendsCount, label: "Amigos", href: "/amigos" },
            { value: calculateLongestStreak(studyDays), label: "Recorde seguido" },
            {
              value: <GrowingNumber value={hoursThisMonth} decimals={1} suffix="h" />,
              label: "Este mês",
            },
          ]}
        />
      </div>

      <ProfileActivity
        userId={user.id}
        initialCheckins={checkinsPage.items}
        initialCursor={checkinsPage.nextCursor}
        initialCalendarCheckins={calendarCheckins}
      />
    </div>
  );
}
