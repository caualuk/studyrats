import { Skeleton } from "@/components/ui/Skeleton";

export default function CronometroLoading() {
  return (
    <div className="mx-auto max-w-[560px] px-4 pb-20 pt-10 text-center sm:px-6 sm:pt-14">
      <Skeleton className="mx-auto mb-8 h-8 w-56 sm:h-9" />
      <Skeleton className="mx-auto h-64 w-full rounded-2xl" />
    </div>
  );
}
