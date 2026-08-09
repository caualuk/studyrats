import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatElapsed } from "@/lib/dates";
import { cn } from "@/lib/cn";

export type PodiumMember = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  studyMs: number;
};

// Display order is left-to-right [2nd, 1st, 3rd] -- the classic podium
// layout, with the leader raised in the middle. Indexes into `top`, which
// is itself already sorted 1st..3rd.
const DISPLAY_ORDER = [1, 0, 2] as const;
const BLOCK_HEIGHT = ["h-28", "h-20", "h-14"] as const; // by place (1st, 2nd, 3rd)

/**
 * "Pódio.": the challenge's top 3 by hours studied, plus a row below always
 * showing the viewer's own rank and hours -- whether or not they made the
 * top 3, so "where do I stand" never requires scanning the podium for your
 * own face.
 */
export function ChallengePodium({
  top,
  viewer,
}: {
  top: PodiumMember[];
  viewer: { position: number; member: PodiumMember } | null;
}) {
  return (
    <Card className="px-4 pb-6 pt-10 sm:px-8">
      <div className="flex items-end justify-center gap-4 sm:gap-8">
        {DISPLAY_ORDER.map((place) => {
          const member = top[place];
          const key = member?.userId ?? `empty-${place}`;
          if (!member) return <div key={key} className="w-20 sm:w-24" />;

          const isFirst = place === 0;
          return (
            <div key={key} className="flex w-20 flex-col items-center sm:w-24">
              <span className="mb-2 max-w-full truncate text-xs font-bold text-white">
                {member.name}
              </span>
              <Avatar
                src={member.avatarUrl}
                name={member.name}
                size={isFirst ? "xl" : "2xl"}
                className="z-10 -mb-4 ring-4 ring-bg"
              />
              <div
                className={cn(
                  "flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl pt-5",
                  BLOCK_HEIGHT[place],
                  isFirst
                    ? "bg-accent text-accent-ink"
                    : "border border-b-0 border-border-strong bg-white/5 text-white"
                )}
              >
                <span className="text-lg font-extrabold">{place + 1}</span>
                <span
                  className={cn(
                    "text-[11px] font-bold",
                    isFirst ? "text-accent-ink/70" : "text-white/50"
                  )}
                >
                  {formatElapsed(member.studyMs)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {viewer && (
        <div className="mt-6">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/35">
            Sua posição
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-3.5 py-3">
            <span className="w-5 shrink-0 text-center text-[13px] font-bold text-white/40">
              {viewer.position}
            </span>
            <Avatar src={viewer.member.avatarUrl} name={viewer.member.name} size="md" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{viewer.member.name}</span>
            <span className="shrink-0 text-[13px] font-bold text-accent">
              {formatElapsed(viewer.member.studyMs)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
