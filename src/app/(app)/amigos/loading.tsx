import { Skeleton } from "@/components/ui/Skeleton";

export default function AmigosLoading() {
  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="mb-[18px] flex items-center justify-between">
        <Skeleton className="h-9 w-40 sm:h-11" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
