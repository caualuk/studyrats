import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { PrivacyForm } from "@/components/configuracoes/PrivacyForm";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <h1 className="mb-8 text-[32px] font-extrabold sm:text-[42px]">Configurações.</h1>
      <PrivacyForm isPrivate={user.isPrivate} />
    </div>
  );
}
