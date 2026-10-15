"use client";

import { useActionState } from "react";
import { salvarConta } from "../usuarios/acoes";

export function FormConta({ nome, whatsapp, obrigatorio }: { nome: string; whatsapp: string; obrigatorio: boolean }) {
  const [estado, acao, pendente] = useActionState(salvarConta, undefined);
  return (
    <form action={acao} className="card" style={{ maxWidth: 560 }}>
      <div className="campo"><label>Nome</label><input name="nome" defaultValue={nome} required /></div>
      <div className="campo"><label>WhatsApp (avisos das suas propostas)</label><input name="whatsapp" defaultValue={whatsapp} placeholder="5511999998888" /></div>
      <h2 style={{ marginTop: 16 }}>{obrigatorio ? "Defina uma nova senha" : "Trocar senha"}</h2>
      <div className="campo"><label>Senha atual</label><input name="senhaAtual" type="password" autoComplete="current-password" required={obrigatorio} /></div>
      <div className="linha2">
        <div className="campo"><label>Nova senha</label><input name="novaSenha" type="password" autoComplete="new-password" required={obrigatorio} /></div>
        <div className="campo"><label>Confirmar nova senha</label><input name="confirmar" type="password" autoComplete="new-password" required={obrigatorio} /></div>
      </div>
      <div className="ajuda" style={{ marginTop: -6, marginBottom: 12 }}>Mínimo 10 caracteres, com letras e números.</div>
      {estado?.erro && <div className="alerta erro">{estado.erro}</div>}
      {estado?.ok && <div className="alerta ok">{estado.ok} {obrigatorio && <a href="/admin">Ir para o painel →</a>}</div>}
      <button className="btn destaque" disabled={pendente}>{pendente ? "Salvando..." : "Salvar"}</button>
    </form>
  );
}
