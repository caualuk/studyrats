import type { ReactNode } from "react";
import { verifySession } from "@/lib/auth/dal";
import { getActiveCheckin } from "@/lib/checkins/queries";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const activeCheckin = await getActiveCheckin(session.userId);

  return (
    <div className="min-h-screen">
      <Navbar activeCheckin={activeCheckin} />
      <main>{children}</main>
    </div>
  );
}
