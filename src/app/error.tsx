"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <Card className="px-6 py-8">
        <h1 className="mb-2 text-lg font-bold">Algo deu errado.</h1>
        <p className="mb-1 text-xs text-white/50">
          Se esta é a primeira vez rodando o projeto, o banco de dados provavelmente ainda
          não está conectado.
        </p>
        <p className="mb-6 text-xs text-white/35">
          Veja &ldquo;Conectando o banco de dados&rdquo; no README.md para criar e migrar o
          banco local.
        </p>
        <Button onClick={reset}>Tentar novamente</Button>
      </Card>
    </div>
  );
}
