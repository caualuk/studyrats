import type { Metadata } from "next";
import { verifySession } from "@/lib/auth/dal";
import { getUserStatsCheckins } from "@/lib/checkins/queries";
import { StatsView } from "@/components/estatisticas/StatsView";

export const metadata: Metadata = { title: "Estatísticas" };

export default async function EstatisticasPage() {
  const session = await verifySession();
  const checkins = await getUserStatsCheckins(session.userId);

  return (
    <div className="mx-auto max-w-[820px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <h1 className="mb-2 text-[32px] font-extrabold sm:text-[42px]">Estatísticas.</h1>
      <p className="mb-8 text-sm text-white/50">
        Suas horas de estudo e o aproveitamento nas questões.
      </p>

      <StatsView checkins={checkins} />
    </div>
  );
}
