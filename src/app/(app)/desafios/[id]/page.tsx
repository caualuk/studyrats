import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChallengeDetail, getChallengeMembers } from "@/lib/challenges/queries";
import { getChallengeCheckinsPage } from "@/lib/checkins/queries";
import { loadMoreChallengeCheckins } from "@/lib/checkins/actions";
import type { RankingRow } from "@/lib/ranking/queries";
import { ChallengeDetailHeader } from "@/components/desafios/ChallengeDetailHeader";
import { ChallengeParticipants } from "@/components/desafios/ChallengeParticipants";
import { ChallengePodium, type PodiumMember } from "@/components/desafios/ChallengePodium";
import { ChallengeRanking } from "@/components/ranking/ChallengeRanking";
import { CheckinGrid } from "@/components/feed/CheckinGrid";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Desafio" };

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const challenge = await getChallengeDetail(id, user.id);
  if (!challenge) notFound();

  const [members, checkinsPage] = await Promise.all([
    getChallengeMembers(id),
    getChallengeCheckinsPage(id, user.id),
  ]);
  const loadMoreForThisChallenge = loadMoreChallengeCheckins.bind(null, id);

  // Metric sort (checkins vs. hours) happens client-side in ChallengeRanking
  // -- both totals are already here, so re-sorting on toggle needs no
  // server round-trip. Position gets recomputed there per metric.
  const rankingRows: RankingRow[] = members.map((member) => ({
    position: 0,
    userId: member.userId,
    name: member.name,
    avatarUrl: member.avatarUrl,
    checkinsCount: member.checkinsCount,
    studyMs: member.studyMs,
  }));

  // Podium: top 3 by hours studied in this challenge. Members with no hours
  // yet are left out entirely (nothing to place them on), same call as
  // ChallengeRanking makes for its own empty state.
  const rankedByHours: PodiumMember[] = members
    .filter((member) => member.studyMs > 0)
    .sort((a, b) => b.studyMs - a.studyMs);
  const podiumTop = rankedByHours.slice(0, 3);
  // Shown below the podium regardless of whether the viewer made the top 3
  // -- their own rank and hours, always front and center.
  const viewerIndex = rankedByHours.findIndex((member) => member.userId === user.id);
  const viewerRank = viewerIndex >= 0 ? { position: viewerIndex + 1, member: rankedByHours[viewerIndex] } : null;

  return (
    <div className="mx-auto max-w-[820px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <ChallengeDetailHeader challenge={challenge} />

      <h2 className="mb-4 mt-10 text-xl font-bold">Participantes.</h2>
      <ChallengeParticipants members={members} challengeId={id} canManage={challenge.canManage} />

      <h2 className="mb-4 mt-10 text-xl font-bold">Pódio.</h2>
      {podiumTop.length === 0 ? (
        <EmptyState title="Ninguém fez check-in nesse desafio ainda." />
      ) : (
        <ChallengePodium top={podiumTop} viewer={viewerRank} />
      )}

      <h2 className="mb-4 mt-10 text-xl font-bold">Ranking.</h2>
      <ChallengeRanking rows={rankingRows} />

      <h2 className="mb-4 mt-10 text-xl font-bold">Check-ins.</h2>
      <CheckinGrid
        initialItems={checkinsPage.items}
        initialCursor={checkinsPage.nextCursor}
        loadMore={loadMoreForThisChallenge}
        emptyState={
          <EmptyState
            title="Nenhum check-in por aqui ainda."
            description="Assim que alguém postar sob esse desafio, aparece nesta lista."
          />
        }
      />
    </div>
  );
}
