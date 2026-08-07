import type { ReactNode } from "react";
import { verifySession } from "@/lib/auth/dal";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await verifySession();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
