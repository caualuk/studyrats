import { Skeleton } from "@/components/ui/Skeleton";

export default function FriendInviteLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-14">
      <Skeleton className="h-56 w-full max-w-sm rounded-2xl" />
    </div>
  );
}
