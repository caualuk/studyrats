import { Skeleton } from "@/components/ui/Skeleton";

export default function DesafiosLoading() {
  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 text-center sm:px-6 sm:pt-14">
      <Skeleton className="mx-auto mb-1.5 h-3 w-16" />
      <Skeleton className="mx-auto mb-2 h-9 w-48 sm:h-11" />
      <Skeleton className="mx-auto mb-9 h-4 w-full max-w-[560px]" />

      <div className="mb-14 flex flex-wrap justify-center gap-3">
        <Skeleton className="h-10 w-36 rounded-full" />
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>

      <Skeleton className="mx-auto mb-5 h-7 w-40" />
      <div className="mx-auto grid max-w-[600px] grid-cols-1 gap-[18px] sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
