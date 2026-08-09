import { Skeleton } from "@/components/ui/Skeleton";

export default function PublicProfileLoading() {
  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <Skeleton className="mb-6 h-4 w-16" />

      <div className="mb-9 flex flex-col items-center gap-3">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="mx-auto mb-8 grid max-w-[560px] grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
