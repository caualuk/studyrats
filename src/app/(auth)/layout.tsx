import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/LogoMark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <LogoMark />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
