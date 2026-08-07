import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyChallengeOptions } from "@/lib/challenges/queries";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const challenges = await getMyChallengeOptions(user.id);

  return (
    <div className="min-h-screen">
      <Navbar challenges={challenges} />
      <main>{children}</main>
    </div>
  );
}
