import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { brl, dataBR, duracao } from "@/lib/formato";
import { STATUS } from "@/lib/rotulos";

export default async function Propostas({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { empresa } = await exigirSessao();
  const { status } = await searchParams;
  const propostas = await db.proposta.findMany({
    where: { empresaId: empresa.id, ...(status && status in STATUS ? { status: status as never } : {}) },
    orderBy: { criadoEm: "desc" },
    take: 200,
    include: { autor: { select: { nome: true } }, modelo: { select: { nome: true } }, visualizacoes: { select: { tempoTotalSeg: true } } },
  });
  return (
    <>
      <div className="topo">
        <div><h1>Propostas</h1><p>Todas as propostas da {empresa.nome}.</p></div>
        <Link className="btn destaque" href="/admin/propostas/nova">+ Nova proposta</Link>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Link className={`btn pequeno ${status ? "claro" : ""}`} href="/admin/propostas">Todas</Link>
        {Object.entries(STATUS).filter(([k]) => k !== "RASCUNHO").map(([k, v]) => (
          <Link key={k} className={`btn pequeno ${status === k ? "" : "claro"}`} href={`/admin/propostas?status=${k}`}>{v}</Link>
        ))}
      </div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Cliente</th><th>Modelo</th><th>Mensal</th><th>Status</th><th>Leitura</th><th>Validade</th><th>Autor</th></tr></thead>
          <tbody>
            {propostas.map((p) => {
              const tempo = p.visualizacoes.reduce((s, v) => s + v.tempoTotalSeg, 0);
              return (
                <tr key={p.id}>
                  <td><Link href={`/admin/propostas/${p.id}`}>{p.clienteNome}</Link></td>
                  <td className="muted">{p.modelo.nome}</td>
                  <td className="mono">{brl(Number(p.valorMensal ?? 0))}</td>
                  <td><span className={`status ${p.status}`}>{STATUS[p.status]}</span></td>
                  <td>{p.visualizacoes.length ? `${p.visualizacoes.length}× · ${duracao(tempo)}` : <span className="muted">não aberta</span>}</td>
                  <td>{dataBR(p.validaAte)}</td>
                  <td className="muted">{p.autor.nome}</td>
                </tr>
              );
            })}
            {propostas.length === 0 && <tr><td colSpan={7} className="vazio">Nenhuma proposta por aqui ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
