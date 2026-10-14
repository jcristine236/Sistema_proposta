"use client";

// Formulário simples ligado a uma server action, com mensagem de retorno.
import { useActionState, type ReactNode } from "react";

type Estado = { ok?: string; erro?: string } | undefined;

export function FormAcao({ acao, children, botao }: { acao: (e: Estado, f: FormData) => Promise<Estado>; children: ReactNode; botao: string }) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);
  return (
    <form action={enviar}>
      {children}
      {estado?.erro && <div className="alerta erro">{estado.erro}</div>}
      {estado?.ok && <div className="alerta ok">{estado.ok}</div>}
      <button className="btn destaque" disabled={pendente}>{pendente ? "Salvando..." : botao}</button>
    </form>
  );
}
