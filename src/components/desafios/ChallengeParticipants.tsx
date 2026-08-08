import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatDatePtBR } from "@/lib/dates";
import type { ChallengeMemberRow } from "@/lib/challenges/queries";
import { AdminToggleButton } from "@/components/desafios/AdminToggleButton";

export function ChallengeParticipants({
  members,
  challengeId,
  canManage,
}: {
  members: ChallengeMemberRow[];
  challengeId: string;
  /** Whether the viewer may grant/revoke admin -- shows the toggle when true. */
  canManage: boolean;
}) {
  return (
    <Card className="p-2 text-left">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center gap-2.5 border-b border-border px-3 py-3.5 last:border-b-0 sm:gap-3.5 sm:px-[18px]"
        >
          <Avatar src={member.avatarUrl} name={member.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">
              {member.name}
              {member.isOwner && <span className="ml-1.5 text-[10px] text-accent">dono</span>}
              {!member.isOwner && member.isAdmin && (
                <span className="ml-1.5 text-[10px] text-accent">admin</span>
              )}
            </div>
            <div className="text-[10px] text-white/35">
              entrou em {formatDatePtBR(member.joinedAt)}
            </div>
          </div>
          <span className="shrink-0 text-[11px] text-white/45">
            {member.checkinsCount} check-ins
          </span>
          {canManage && !member.isOwner && (
            <AdminToggleButton
              challengeId={challengeId}
              memberUserId={member.userId}
              isAdmin={member.isAdmin}
            />
          )}
        </div>
      ))}
    </Card>
  );
}
