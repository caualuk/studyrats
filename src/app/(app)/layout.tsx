import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getActiveCheckin } from "@/lib/checkins/queries";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const activeCheckin = await getActiveCheckin(user.id);

  return (
    <div className="min-h-screen">
      <Navbar activeCheckin={activeCheckin} user={user} />
      {/* Bottom padding clears the fixed BottomTabBar on mobile so page content never sits behind it. */}
      <main className="pb-24 md:pb-0">{children}</main>
      <BottomTabBar />
    </div>
  );
}
