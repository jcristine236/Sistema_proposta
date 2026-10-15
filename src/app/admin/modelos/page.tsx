import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { BLOCO, BLOCOS } from "@/lib/blocos";
import type { Campo } from "@/lib/campos";
import type { Secao } from "@/lib/secoes";
import { dataBR } from "@/lib/formato";
import { BotaoConfirmar } from "@/components/admin/Confirmar";
import { alternarModelo, criarModeloEmBranco, criarSecaoModelo, duplicarModelo, excluirModelo, excluirSecaoModelo, renomearSecaoModelo } from "./acoes";

export default async function Modelos({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const s = await exigirSessao("modelos");
  const aba = (await searchParams).aba === "secoes" ? "secoes" : "modelos";
  const [modelos, secoes] = await Promise.all([
    db.modelo.findMany({ where: { empresaId: s.empresa.id }, orderBy: [{ ativo: "desc" }, { nome: "asc" }], include: { _count: { select: { propostas: true } } } }),
    db.secaoModelo.findMany({ where: { empresaId: s.empresa.id }, orderBy: { nome: "asc" } }),
  ]);
  const criar = s.permite("modelos", "criar");
  const editar = s.permite("modelos", "editar");
  const excluir = s.permite("modelos", "excluir");

  return (
    <>
      <div className="topo">
        <div><h1>Modelos</h1><p>Monte propostas completas ou seções avulsas para reaproveitar, arrastando blocos.</p></div>
        <div className="abas">
          <Link href="/admin/modelos" className={`aba ${aba === "modelos" ? "on" : ""}`}>Modelos de proposta ({modelos.length})</Link>
          <Link href="/admin/modelos?aba=secoes" className={`aba ${aba === "secoes" ? "on" : ""}`}>Seções modelo ({secoes.length})</Link>
        </div>
      </div>

      {aba === "modelos" ? (
        <>
          {criar && (
            <form action={criarModeloEmBranco} style={{ marginBottom: 14 }}>
              <button className="btn destaque">+ Novo modelo em branco</button>
            </form>
          )}
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Modelo</th><th>Estrutura</th><th>Propostas</th><th>Atualizado</th><th style={{ textAlign: "right" }}>Ações</th></tr></thead>
              <tbody>
                {modelos.map((m) => (
                  <tr key={m.id} style={{ opacity: m.ativo ? 1 : 0.55 }}>
                    <td>
                      <Link href={`/admin/modelos/${m.id}/editar`}>{m.nome}</Link> {!m.ativo && <span className="status">Inativo</span>}
                      <div className="muted" style={{ fontSize: 12.5 }}>{m.descricao}</div>
                    </td>
                    <td className="muted">{(m.secoes as Secao[]).length} seções · {(m.campos as Campo[]).length} campos</td>
                    <td>{m._count.propostas}</td>
                    <td className="muted">{dataBR(m.atualizadoEm)}</td>
                    <td>
                      <div className="acoes-linha">
                        {m.ativo && s.permite("propostas", "criar") && <Link className="btn pequeno" href={`/admin/propostas/nova/${m.id}`}>Usar</Link>}
                        <Link className="btn claro pequeno" href={`/admin/modelos/${m.id}/editar`}>{editar ? "Editar" : "Ver"}</Link>
                        {criar && <form action={duplicarModelo.bind(null, m.id)}><button className="btn claro pequeno">Duplicar</button></form>}
                        {editar && <form action={alternarModelo.bind(null, m.id)}><button className="btn claro pequeno">{m.ativo ? "Desativar" : "Ativar"}</button></form>}
                        {excluir && (
                          <form action={excluirModelo.bind(null, m.id)}>
                            <BotaoConfirmar mensagem={`Excluir o modelo "${m.nome}"? As propostas já enviadas continuam funcionando.`}>Excluir</BotaoConfirmar>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {modelos.length === 0 && <tr><td colSpan={5} className="vazio">Nenhum modelo ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {criar && (
            <div className="card" style={{ marginBottom: 14 }}>
              <h2>Nova seção modelo</h2>
              <p className="muted" style={{ marginTop: -8 }}>Escolha o tipo de bloco. Você também pode salvar qualquer seção de um modelo com ★ dentro do editor.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {BLOCOS.filter((b) => b.tipo !== "capa").map((b) => (
                  <form key={b.tipo} action={criarSecaoModelo.bind(null, b.tipo)}><button className="btn claro pequeno">{b.nome}</button></form>
                ))}
              </div>
            </div>
          )}
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Seção</th><th>Tipo</th><th>Atualizada</th><th style={{ textAlign: "right" }}>Ações</th></tr></thead>
              <tbody>
                {secoes.map((sec) => {
                  const tipo = (sec.secao as unknown as Secao).tipo;
                  return (
                    <tr key={sec.id}>
                      <td>
                        {editar ? (
                          <form action={renomearSecaoModelo.bind(null, sec.id)} style={{ display: "flex", gap: 6 }}>
                            <input name="nome" defaultValue={sec.nome} className="input-inline" aria-label="Nome da seção" />
                            <button className="btn claro pequeno">Renomear</button>
                          </form>
                        ) : sec.nome}
                      </td>
                      <td><span className="chip">{BLOCO[tipo]?.nome ?? tipo}</span></td>
                      <td className="muted">{dataBR(sec.atualizadoEm)}</td>
                      <td>
                        <div className="acoes-linha">
                          <Link className="btn claro pequeno" href={`/admin/modelos/secoes/${sec.id}`}>{editar ? "Editar" : "Ver"}</Link>
                          {excluir && (
                            <form action={excluirSecaoModelo.bind(null, sec.id)}>
                              <BotaoConfirmar mensagem={`Excluir a seção "${sec.nome}"? Modelos que já a usam não são afetados.`}>Excluir</BotaoConfirmar>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {secoes.length === 0 && <tr><td colSpan={4} className="vazio">Nenhuma seção salva ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
