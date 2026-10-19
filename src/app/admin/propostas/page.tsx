import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao, filtroPropostas } from "@/lib/auth";
import { brl, dataBR, duracao } from "@/lib/formato";
import { STATUS } from "@/lib/rotulos";

export default async function Propostas({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const s = await exigirSessao("propostas");
  const { status, q } = await searchParams;
  const busca = (q ?? "").trim().slice(0, 80);
  const propostas = await db.proposta.findMany({
    where: {
      ...filtroPropostas(s),
      ...(status && status in STATUS ? { status: status as never } : {}),
      ...(busca ? { OR: [{ codigo: { contains: busca, mode: "insensitive" } }, { clienteNome: { contains: busca, mode: "insensitive" } }] } : {}),
    },
    orderBy: { criadoEm: "desc" },
    take: 300,
    include: { autor: { select: { nome: true } }, modelo: { select: { nome: true } }, visualizacoes: { select: { tempoTotalSeg: true } } },
  });
  const qs = (st?: string) => `/admin/propostas?${new URLSearchParams({ ...(st ? { status: st } : {}), ...(busca ? { q: busca } : {}) })}`;
  return (
    <>
      <div className="topo">
        <div><h1>Propostas</h1><p>Histórico e acompanhamento das propostas da {s.empresa.nome}.</p></div>
        {s.permite("propostas", "criar") && <Link className="btn destaque" href="/admin/propostas/nova">+ Nova proposta</Link>}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <form style={{ display: "flex", gap: 6 }}>
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={busca} placeholder="Buscar por número ou cliente" className="input-inline" style={{ width: 260 }} />
          <button className="btn claro pequeno">Buscar</button>
        </form>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link className={`btn pequeno ${status ? "claro" : ""}`} href={qs()}>Todas</Link>
          {Object.entries(STATUS).filter(([k]) => k !== "RASCUNHO").map(([k, v]) => (
            <Link key={k} className={`btn pequeno ${status === k ? "" : "claro"}`} href={qs(k)}>{v}</Link>
          ))}
        </div>
      </div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Nº</th><th>Cliente</th><th>Modelo</th><th>Valor</th><th>Status</th><th>Leitura</th><th>Validade</th><th>Autor</th></tr></thead>
          <tbody>
            {propostas.map((p) => {
              const tempo = p.visualizacoes.reduce((t, v) => t + v.tempoTotalSeg, 0);
              return (
                <tr key={p.id}>
                  <td className="mono"><Link href={`/admin/propostas/${p.id}`}>{p.codigo}</Link></td>
                  <td><Link href={`/admin/propostas/${p.id}`}>{p.clienteNome}</Link></td>
                  <td className="muted">{p.modelo?.nome ?? "—"}</td>
                  <td className="mono">{Number(p.valorMensal) > 0 ? `${brl(Number(p.valorMensal))}/mês` : brl(Number(p.valorUnico ?? 0))}</td>
                  <td><span className={`status ${p.status}`}>{STATUS[p.status]}</span></td>
                  <td>{p.visualizacoes.length ? `${p.visualizacoes.length}× · ${duracao(tempo)}` : <span className="muted">não aberta</span>}</td>
                  <td>{dataBR(p.validaAte)}</td>
                  <td className="muted">{p.autor.nome}</td>
                </tr>
              );
            })}
            {propostas.length === 0 && <tr><td colSpan={8} className="vazio">Nenhuma proposta encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
