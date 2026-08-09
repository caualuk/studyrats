import { Skeleton } from "@/components/ui/Skeleton";

export default function RankingLoading() {
  return (
    <div className="mx-auto max-w-[820px] px-4 pb-20 pt-10 text-center sm:px-6 sm:pt-14">
      <Skeleton className="mx-auto mb-2 h-9 w-52 sm:h-11" />
      <Skeleton className="mx-auto mb-6 h-4 w-56" />
      <Skeleton className="mx-auto mb-3 h-9 w-64 rounded-full" />
      <Skeleton className="mx-auto mb-8 h-9 w-40 rounded-full" />
      <div className="rounded-2xl border border-border bg-surface p-2 text-left">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 border-b border-border px-3 py-3.5 last:border-b-0 sm:gap-3.5 sm:px-[18px]"
          >
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
