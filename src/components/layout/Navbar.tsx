import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { LogoMark } from "@/components/layout/LogoMark";
import { NavCronometer } from "@/components/layout/NavCronometer";
import { NavTabs } from "@/components/layout/NavTabs";
import { UserMenu } from "@/components/layout/UserMenu";
import type { ActiveCheckin } from "@/lib/checkins/queries";

export function Navbar({
  activeCheckin,
  user,
}: {
  activeCheckin: ActiveCheckin | null;
  user: { name: string; username: string; avatarUrl: string | null };
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3.5 backdrop-blur-sm sm:px-6 md:px-8">
      <Link href="/feed">
        <LogoMark />
      </Link>

      <NavTabs />

      <div className="flex items-center gap-3 sm:gap-5">
        <NavCronometer activeCheckin={activeCheckin} />
        <UserMenu user={user} />
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
