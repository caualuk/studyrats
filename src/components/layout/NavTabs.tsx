"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiAward, FiBarChart2, FiHome, FiTarget, FiUser, FiUsers } from "react-icons/fi";
import { cn } from "@/lib/cn";

// `icon` is only rendered by BottomTabBar (the desktop row stays text-only).
export const TABS = [
  { href: "/feed", label: "Feed", icon: FiHome },
  { href: "/ranking", label: "Ranking", icon: FiAward },
  { href: "/desafios", label: "Desafios", icon: FiTarget },
  { href: "/amigos", label: "Amigos", icon: FiUsers },
  { href: "/estatisticas", label: "Estatísticas", icon: FiBarChart2 },
] as const;

// The mobile bottom bar additionally surfaces Perfil as its own quick-access
// tab -- desktop already reaches it via the navbar's avatar menu, so NavTabs
// doesn't need it duplicated there.
export const MOBILE_TABS = [...TABS, { href: "/perfil", label: "Perfil", icon: FiUser }] as const;

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
