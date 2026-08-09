import { Skeleton } from "@/components/ui/Skeleton";

export default function ConfiguracoesLoading() {
  return (
    <div className="mx-auto max-w-[480px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <Skeleton className="mb-8 h-9 w-64 sm:h-11" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
