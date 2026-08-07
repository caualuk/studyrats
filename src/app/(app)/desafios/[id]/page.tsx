import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChallengeDetail, getChallengeMembers } from "@/lib/challenges/queries";
import {
  getChallengeCheckins,
  getChallengeCheckinDatesByMember,
  type FeedCheckin,
} from "@/lib/checkins/queries";
import { daysBetween, getStreakStatus } from "@/lib/dates";
import type { RankingRow } from "@/lib/ranking/queries";
import { ChallengeDetailHeader } from "@/components/desafios/ChallengeDetailHeader";
import { ChallengeParticipants } from "@/components/desafios/ChallengeParticipants";
import { ChallengeTrack, type TrackRunner } from "@/components/desafios/ChallengeTrack";
import { RankingList } from "@/components/ranking/RankingList";
import { CheckinCard } from "@/components/feed/CheckinCard";
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

  const [members, checkins, checkinDatesByMember] = await Promise.all([
    getChallengeMembers(id),
    getChallengeCheckins(id, user.id),
    getChallengeCheckinDatesByMember(id),
  ]);

  const rankedMembers = [...members].sort((a, b) => b.checkinsCount - a.checkinsCount);

  const rankingRows: RankingRow[] = rankedMembers.map((member, index) => ({
    position: index + 1,
    userId: member.userId,
    name: member.name,
    avatarUrl: member.avatarUrl,
    checkinsCount: member.checkinsCount,
  }));

  // With a deadline, the goal is only met by keeping the streak alive all
  // the way to that date -- so progress is the member's *current* streak
  // within this challenge over the challenge's total length, not a single
  // check-in. Without a deadline there's no fixed target to race against,
  // so runners race relatively against the front-runner instead.
  const totalDays = challenge.endDate ? daysBetween(challenge.startDate, challenge.endDate) : null;
  const leaderCheckins = Math.max(1, rankedMembers[0]?.checkinsCount ?? 0);

  // `checkins` is newest-first, so the first match per author is their most
  // recent check-in in this challenge -- what tapping their photo opens.
  const latestCheckinByAuthor = new Map<string, FeedCheckin>();
  for (const checkin of checkins) {
    if (!latestCheckinByAuthor.has(checkin.authorId)) {
      latestCheckinByAuthor.set(checkin.authorId, checkin);
    }
  }

  const runners: TrackRunner[] = rankedMembers.map((member) => {
    let progress: number;
    if (totalDays && totalDays > 0) {
      const streakStatus = getStreakStatus(checkinDatesByMember.get(member.userId) ?? []);
      const streakDays = streakStatus.kind === "active" ? streakStatus.days : 0;
      progress = Math.min(100, (streakDays / totalDays) * 100);
    } else {
      progress = (member.checkinsCount / leaderCheckins) * 100;
    }
    return {
      userId: member.userId,
      name: member.name,
      avatarUrl: member.avatarUrl,
      progress,
      checkin: latestCheckinByAuthor.get(member.userId) ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-[820px] px-6 pb-20 pt-14">
      <ChallengeDetailHeader challenge={challenge} />

      <h2 className="mb-4 mt-10 text-xl font-bold">Participantes.</h2>
      <ChallengeParticipants members={members} challengeId={id} canManage={challenge.canManage} />

      <h2 className="mb-1.5 mt-10 text-xl font-bold">A pista.</h2>
      <p className="mb-4 text-[11px] text-white/40">
        {totalDays && totalDays > 0
          ? `Sua posição é sua sequência atual de check-ins dividida pelos ${totalDays} dias até a meta -- só chega lá quem mantiver a sequência até o fim.`
          : "Quem tem mais check-ins nesse desafio lidera a pista."}
      </p>
      <ChallengeTrack runners={runners} />

      <h2 className="mb-4 mt-10 text-xl font-bold">Ranking.</h2>
      {rankingRows.some((row) => row.checkinsCount > 0) ? (
        <RankingList rows={rankingRows.filter((row) => row.checkinsCount > 0)} />
      ) : (
        <EmptyState title="Ninguém fez check-in nesse desafio ainda." />
      )}

      <h2 className="mb-4 mt-10 text-xl font-bold">Check-ins.</h2>
      {checkins.length === 0 ? (
        <EmptyState
          title="Nenhum check-in por aqui ainda."
          description="Assim que alguém postar sob esse desafio, aparece nesta lista."
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
