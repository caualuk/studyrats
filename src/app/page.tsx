import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/auth/dal";

export default async function RootPage() {
  const session = await getOptionalSession();
  redirect(session ? "/feed" : "/login");
}
