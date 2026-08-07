import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-sm font-bold text-white">{title}</p>
      {description && <p className="max-w-sm text-xs text-white/45">{description}</p>}
      {action}
    </Card>
  );
}
