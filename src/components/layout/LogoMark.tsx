import { cn } from "@/lib/cn";

export function LogoMark({
  withLabel = true,
  className,
}: {
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-accent">
        <div className="h-[9px] w-[9px] rounded-[3px] bg-bg" />
      </div>
      {withLabel && (
        <span className="text-[15px] font-bold tracking-[0.2px]">StudyRats</span>
      )}
    </div>
  );
}
