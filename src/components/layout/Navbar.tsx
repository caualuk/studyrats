import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { LogoMark } from "@/components/layout/LogoMark";
import { NavCronometer } from "@/components/layout/NavCronometer";
import { NavTabs } from "@/components/layout/NavTabs";
import type { ActiveCheckin } from "@/lib/checkins/queries";

export function Navbar({ activeCheckin }: { activeCheckin: ActiveCheckin | null }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-8 py-3.5 backdrop-blur-sm">
      <Link href="/feed">
        <LogoMark />
      </Link>

      <NavTabs />

      <div className="flex items-center gap-5">
        <NavCronometer activeCheckin={activeCheckin} />
        <form action={logout}>
          <button
            type="submit"
            className="cursor-pointer text-[13px] text-white/60 hover:text-white"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
