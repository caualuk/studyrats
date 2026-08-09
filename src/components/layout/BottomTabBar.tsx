"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "@/components/layout/NavTabs";
import { cn } from "@/lib/cn";

/**
 * Mobile-only nav (replaces NavTabs below `md`) -- a fixed bottom bar, the
 * standard mobile-app pattern, since a horizontal tab row has nowhere left
 * to go once the navbar's logo/timer/logout already fill a narrow screen.
 * `env(safe-area-inset-bottom)` keeps it clear of the home-indicator strip
 * on notched phones.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t border-border bg-bg/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3.5"
          >
            <span
              aria-hidden
              className={cn(
                "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                isActive ? "bg-accent/15 text-accent" : "text-white/50"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.25 : 2} />
            </span>
            <span
              className={cn(
                "text-[11px] transition-colors",
                isActive ? "font-bold text-accent" : "font-normal text-white/50"
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
