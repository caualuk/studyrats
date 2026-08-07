import { AvatarUploader } from "@/components/perfil/AvatarUploader";
import { EditProfileDialog } from "@/components/perfil/EditProfileDialog";
import { StreakLine } from "@/components/perfil/StreakLine";
import type { StreakStatus } from "@/lib/dates";

export function ProfileHeader({
  name,
  username,
  avatarUrl,
  bio,
  streakStatus,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  streakStatus: StreakStatus;
}) {
  return (
    <div className="mb-9 text-center">
      <AvatarUploader avatarUrl={avatarUrl} name={name} />
      <h1 className="mb-0.5 text-[32px] font-extrabold">{name}</h1>
      <p className="mb-2 text-[13px] text-white/40">@{username}</p>
      <StreakLine status={streakStatus} />
      {bio && (
        <p className="mx-auto mb-3 max-w-sm whitespace-pre-line text-[13px] leading-relaxed text-white/60">
          {bio}
        </p>
      )}
      <EditProfileDialog name={name} username={username} bio={bio} />
    </div>
  );
}
