import { AvatarUploader } from "@/components/perfil/AvatarUploader";
import { EditProfileDialog } from "@/components/perfil/EditProfileDialog";
import type { StreakStatus } from "@/lib/dates";

function StreakLine({ status }: { status: StreakStatus }) {
  if (status.kind === "active") {
    return (
      <div className="mb-2 text-[13px] text-accent">
        🔥 {status.days} {status.days === 1 ? "dia seguido" : "dias seguidos"}
      </div>
    );
  }

  if (status.kind === "lost") {
    return (
      <div className="mb-2 text-[13px] text-red-400">
        Você perdeu a sequência. Total de {status.days}{" "}
        {status.days === 1 ? "dia" : "dias"}
      </div>
    );
  }

  return <div className="mb-2 text-[13px] text-white/50">Você não tem sequência</div>;
}

export function ProfileHeader({
  name,
  avatarUrl,
  bio,
  streakStatus,
}: {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  streakStatus: StreakStatus;
}) {
  return (
    <div className="mb-9 text-center">
      <AvatarUploader avatarUrl={avatarUrl} name={name} />
      <h1 className="mb-2 text-[32px] font-extrabold">{name}</h1>
      <StreakLine status={streakStatus} />
      {bio && (
        <p className="mx-auto mb-3 max-w-sm whitespace-pre-line text-[13px] leading-relaxed text-white/60">
          {bio}
        </p>
      )}
      <EditProfileDialog bio={bio} />
    </div>
  );
}
