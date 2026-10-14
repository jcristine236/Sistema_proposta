"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export function FormLogin({ voltar }: { voltar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, undefined);
  return (
    <form action={acao}>
      <input type="hidden" name="voltar" value={voltar} />
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      {estado?.erro && <div className="alerta erro">{estado.erro}</div>}
      <button className="btn destaque" style={{ width: "100%" }} disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
