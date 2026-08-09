import { Skeleton } from "@/components/ui/Skeleton";

export default function ChallengeDetailLoading() {
  return (
    <div className="mx-auto max-w-[820px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <Skeleton className="mb-10 h-40 w-full rounded-2xl" />

      <Skeleton className="mb-4 h-6 w-40" />
      <div className="mb-10 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-12 shrink-0 rounded-full" />
        ))}
      </div>

      <Skeleton className="mb-1.5 h-6 w-24" />
      <Skeleton className="mb-4 h-3 w-full max-w-md" />
      <Skeleton className="mb-10 h-32 w-full rounded-2xl" />

      <Skeleton className="mb-4 h-6 w-28" />
      <Skeleton className="mb-4 h-9 w-40 rounded-full" />
      <Skeleton className="mb-10 h-40 w-full rounded-2xl" />

      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
