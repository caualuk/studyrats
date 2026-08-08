"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export const TABS = [
  { href: "/feed", label: "Feed" },
  { href: "/ranking", label: "Ranking" },
  { href: "/desafios", label: "Desafios" },
  { href: "/perfil", label: "Perfil" },
] as const;

/** Desktop/tablet nav row -- hidden below `md`, where BottomTabBar takes over instead. */
export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-7 md:flex">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-[13px] transition-colors",
              isActive ? "font-bold text-white" : "font-normal text-white/50 hover:text-white/80"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
