import { Skeleton } from "@/components/ui/Skeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <Skeleton className="mx-auto mb-2 h-9 w-40 sm:h-11" />
      <Skeleton className="mx-auto mb-6 h-4 w-64" />
      <Skeleton className="mb-8 h-20 w-full rounded-2xl" />
      <Skeleton className="mb-[18px] h-6 w-48" />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
