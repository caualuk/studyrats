import { AvatarUploader } from "@/components/perfil/AvatarUploader";
import { EditProfileDialog } from "@/components/perfil/EditProfileDialog";
import { StreakLine } from "@/components/perfil/StreakLine";
import type { StreakStatus } from "@/lib/dates";

export function ProfileHeader({
  name,
  username,
  avatarUrl,
  streakStatus,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  streakStatus: StreakStatus;
}) {
  return (
    <div className="mb-9 text-center">
      <AvatarUploader avatarUrl={avatarUrl} name={name} />
      <h1 className="mb-0.5 text-[26px] font-extrabold sm:text-[32px]">{name}</h1>
      <p className="mb-2 text-[13px] text-white/40">@{username}</p>
      <StreakLine status={streakStatus} />
      <EditProfileDialog name={name} username={username} />
    </div>
  );
}
