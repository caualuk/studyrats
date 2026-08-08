import type { ReactNode } from "react";
import { verifySession } from "@/lib/auth/dal";
import { getActiveCheckin } from "@/lib/checkins/queries";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const activeCheckin = await getActiveCheckin(session.userId);

  return (
    <div className="min-h-screen">
      <Navbar activeCheckin={activeCheckin} />
      {/* Bottom padding clears the fixed BottomTabBar on mobile so page content never sits behind it. */}
      <main className="pb-16 md:pb-0">{children}</main>
      <BottomTabBar />
    </div>
  );
}
