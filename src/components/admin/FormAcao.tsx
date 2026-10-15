"use client";

// Formulário simples ligado a uma server action, com mensagem de retorno.
import { useActionState, type ReactNode } from "react";

type Estado = { ok?: string; erro?: string } | undefined;

export function FormAcao({ acao, children, botao, cancelar }: { acao: (e: Estado, f: FormData) => Promise<Estado>; children: ReactNode; botao: string; cancelar?: ReactNode }) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);
  return (
    <form action={enviar}>
      {children}
      {estado?.erro && <div className="alerta erro">{estado.erro}</div>}
      {estado?.ok && <div className="alerta ok">{estado.ok}</div>}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn destaque" disabled={pendente}>{pendente ? "Salvando..." : botao}</button>
        {cancelar}
      </div>
    </form>
  );
}
