import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyChallenges } from "@/lib/challenges/queries";
import { CreateChallengeDialog } from "@/components/desafios/CreateChallengeDialog";
import { JoinChallengeDialog } from "@/components/desafios/JoinChallengeDialog";
import { ChallengeCard } from "@/components/desafios/ChallengeCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Desafios" };

export default async function DesafiosPage() {
  const user = await getCurrentUser();
  const challenges = await getMyChallenges(user.id);

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 text-center sm:px-6 sm:pt-14">
      <div className="mb-1.5 text-xs uppercase tracking-wide text-white/40">Privado</div>
      <h1 className="mb-2 text-[32px] font-extrabold sm:text-[42px]">Desafios.</h1>
      <p className="mx-auto mb-9 max-w-[560px] text-[13px] text-white/50">
        Um desafio é um grupo com prazo, capa e bate-papo próprio. Não aparece em nenhuma
        listagem pública: só entra quem receber o link ou o código.
      </p>

      <div className="mb-14 flex flex-wrap justify-center gap-3">
        <CreateChallengeDialog />
        <JoinChallengeDialog />
      </div>

      <h2 className="mb-5 text-[22px] font-bold">Meus desafios.</h2>

      {challenges.length === 0 ? (
        <EmptyState
          title="Você ainda não participa de nenhum desafio."
          description="Crie um desafio ou entre com um código de convite acima."
        />
      ) : (
        <div className="mx-auto grid max-w-[600px] grid-cols-1 gap-[18px] sm:grid-cols-2">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
}
