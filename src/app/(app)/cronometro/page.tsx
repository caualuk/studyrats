import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveCheckin } from "@/lib/checkins/queries";
import { getMyChallengeOptions } from "@/lib/challenges/queries";
import { CronometerView } from "@/components/cronometro/CronometerView";

export const metadata: Metadata = { title: "Cronômetro" };

export default async function CronometroPage() {
  const user = await getCurrentUser();
  const [activeCheckin, challenges] = await Promise.all([
    getActiveCheckin(user.id),
    getMyChallengeOptions(user.id),
  ]);

  return (
    <div className="mx-auto max-w-[560px] px-6 pb-20 pt-14 text-center">
      <h1 className="mb-8 text-[32px] font-extrabold">Cronômetro.</h1>
      <CronometerView activeCheckin={activeCheckin} challenges={challenges} />
    </div>
  );
}
