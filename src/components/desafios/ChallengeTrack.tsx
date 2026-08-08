import { Card } from "@/components/ui/Card";
import { TrackRunnerAvatar } from "@/components/desafios/TrackRunnerAvatar";
import type { FeedCheckin } from "@/lib/checkins/queries";

export type TrackRunner = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 0-100: how far along the pack this runner is, relative to the front-runner. */
  progress: number;
  /** This runner's most recent check-in in the challenge, if any -- tapping their photo opens it. */
  checkin: FeedCheckin | null;
};

// The track's usable width, in percent, from the start line to the finish
// line -- leaves room on both ends so avatars at 0% and 100% progress don't
// clip past the card's edge.
const TRACK_START = 4;
const TRACK_END = 90;

function trackLeft(percent: number): number {
  return TRACK_START + (percent / 100) * (TRACK_END - TRACK_START);
}

/**
 * "A pista.": a literal race track -- one lane per participant, their photo
 * as the runner, racing toward the finish line at the pack leader's pace.
 */
export function ChallengeTrack({ runners }: { runners: TrackRunner[] }) {
  return (
    <Card className="overflow-hidden p-6 pt-10">
      {/*
        The finish-line label is `whitespace-nowrap` and centered on a fixed
        percentage of the track's width -- on a narrow phone the track
        itself shrinks enough that the label would overflow past the card's
        edge and get clipped. `min-w` + horizontal scroll keeps the whole
        track (and its labels) at a legible size instead, matching the
        percentage math's assumption of a reasonably wide track.
      */}
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          <div className="relative">
            <div
              className="absolute inset-y-0 border-l border-dashed border-accent/70"
              style={{ left: `${TRACK_END}%` }}
            >
              <span className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-[10px] text-accent">
                🏁 linha de chegada
              </span>
              <span className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap text-[10px] text-accent">
                meta
              </span>
            </div>

            <div className="flex flex-col">
              {runners.map((runner) => (
                <div
                  key={runner.userId}
                  className="relative h-[72px] border-b border-border last:border-b-0"
                >
                  <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${trackLeft(runner.progress)}%` }}
                  >
                    <TrackRunnerAvatar
                      name={runner.name}
                      avatarUrl={runner.avatarUrl}
                      checkin={runner.checkin}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-3 h-4 text-[10px] text-white/35">
            {[25, 50, 75].map((percent) => (
              <span
                key={percent}
                className="absolute -translate-x-1/2"
                style={{ left: `${trackLeft(percent)}%` }}
              >
                {percent}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
