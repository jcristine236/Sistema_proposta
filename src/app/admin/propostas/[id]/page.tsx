import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { brl, dataBR, dataHoraBR, duracao } from "@/lib/formato";
import { linkPublico } from "@/lib/links";
import { EVENTOS, STATUS } from "@/lib/rotulos";
import type { Calculo } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { CopiarLink } from "@/components/admin/CopiarLink";

export default async function DetalheProposta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { empresa } = await exigirSessao();
  const p = await db.proposta.findFirst({
    where: { id, empresaId: empresa.id },
    include: {
      autor: { select: { nome: true } },
      modelo: { select: { nome: true } },
      eventos: { orderBy: { criadoEm: "desc" } },
      visualizacoes: { orderBy: { iniciadaEm: "desc" }, include: { secoes: true } },
    },
  });
  if (!p) notFound();

  const link = linkPublico(empresa.dominioPropostas, p.slug);
  const calc = p.calculo as Calculo;
  const secoes = ((p.snapshot as { secoes: Secao[] }).secoes ?? []);
  const tempoPorSecao = new Map<string, number>();
  for (const v of p.visualizacoes) for (const s of v.secoes) tempoPorSecao.set(s.secao, (tempoPorSecao.get(s.secao) ?? 0) + s.segundos);
  const maxTempo = Math.max(1, ...tempoPorSecao.values());
  const tempoTotal = p.visualizacoes.reduce((s, v) => s + v.tempoTotalSeg, 0);
  const leitores = new Set(p.visualizacoes.map((v) => v.viewerId)).size;
  const comentarios = p.eventos.filter((e) => e.tipo === "COMENTARIO");

  return (
    <>
      <div className="topo">
        <div>
          <h1>{p.clienteNome}</h1>
          <p>{p.modelo.nome} · criada em {dataHoraBR(p.criadoEm)} por {p.autor.nome}</p>
        </div>
        <span className={`status ${p.status}`} style={{ fontSize: 14, padding: "6px 14px" }}>{STATUS[p.status]}</span>
      </div>

      <div className="card link-box" style={{ marginTop: 0 }}>
        <strong>Link público</strong>
        <code>{link}</code>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <CopiarLink link={link} />
          <a className="btn claro pequeno" href={link} target="_blank" rel="noreferrer">Abrir como cliente</a>
        </div>
        <div className="ajuda muted" style={{ fontSize: 12, marginTop: 8 }}>Suas próprias visitas logado no painel não contam como leitura.</div>
      </div>

      <div className="grade g4" style={{ marginTop: 16 }}>
        <div className="card kpi"><small>Mensalidade</small><b>{brl(calc.totalMensal)}</b><span>{calc.desconto.valor > 0 ? `com desconto de ${brl(calc.desconto.valor)}` : "sem desconto"}</span></div>
        <div className="card kpi"><small>Valor único</small><b>{brl(calc.totalUnico)}</b><span>implantação</span></div>
        <div className="card kpi"><small>Leitura</small><b>{duracao(tempoTotal)}</b><span>{p.visualizacoes.length} acesso(s), {leitores} leitor(es)</span></div>
        <div className="card kpi"><small>Validade</small><b>{dataBR(p.validaAte)}</b><span>{p.primeiraAberturaEm ? `aberta em ${dataHoraBR(p.primeiraAberturaEm)}` : "ainda não aberta"}</span></div>
      </div>
      {p.descontoAcimaLimite && <div className="alerta aviso" style={{ marginTop: 14 }}>Esta proposta foi enviada com desconto acima do limite de aprovação ({calc.desconto.pct.toFixed(1)}%).</div>}
      {p.decididaEm && (
        <div className={`alerta ${p.status === "ACEITA" ? "ok" : "erro"}`} style={{ marginTop: 14 }}>
          {p.status === "ACEITA" ? "Aceita" : "Recusada"} por <b>{p.decisaoNome}</b> em {dataHoraBR(p.decididaEm)}
          {p.motivoRecusa && <> · Motivo: <b>{p.motivoRecusa}</b></>}
          {p.comentarioDecisao && <> · “{p.comentarioDecisao}”</>}
        </div>
      )}

      <div className="grade g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Tempo de leitura por seção</h2>
          {tempoPorSecao.size === 0 && <div className="vazio">Assim que o cliente abrir o link, o tempo em cada seção aparece aqui.</div>}
          {tempoPorSecao.size > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {secoes.map((s) => {
                const t = tempoPorSecao.get(s.id) ?? 0;
                return (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{s.capitulo ?? s.id}</span><span className="mono muted">{duracao(t)}</span>
                    </div>
                    <div className="barra"><i style={{ width: `${(t / maxTempo) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <h2>Linha do tempo</h2>
          <div className="linha-tempo">
            {p.eventos.map((e) => {
              const d = (e.dados ?? {}) as { nome?: string; texto?: string };
              return (
                <div key={e.id}>
                  <span className="muted">{dataHoraBR(e.criadoEm)}</span>
                  <span>{EVENTOS[e.tipo] ?? e.tipo}{d.nome && <> · <b>{d.nome}</b></>}{d.texto && <><br /><span className="muted">“{d.texto}”</span></>}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grade g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Acessos</h2>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Início</th><th>Duração</th><th>Navegador</th></tr></thead>
              <tbody>
                {p.visualizacoes.map((v) => (
                  <tr key={v.id}>
                    <td>{dataHoraBR(v.iniciadaEm)}</td>
                    <td className="mono">{duracao(v.tempoTotalSeg)}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{resumirNavegador(v.userAgent)}</td>
                  </tr>
                ))}
                {p.visualizacoes.length === 0 && <tr><td colSpan={3} className="vazio">Nenhum acesso ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2>Comentários do cliente</h2>
          {comentarios.length === 0 && <div className="vazio">Nenhum comentário.</div>}
          {comentarios.map((c) => {
            const d = c.dados as { nome?: string; email?: string; texto?: string };
            return (
              <div key={c.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
                <b>{d.nome}</b> {d.email && <span className="muted">· {d.email}</span>} <span className="muted">· {dataHoraBR(c.criadoEm)}</span>
                <div>{d.texto}</div>
              </div>
            );
          })}
          <div style={{ marginTop: 14 }}><Link className="btn claro pequeno" href="/admin/propostas">← Voltar às propostas</Link></div>
        </div>
      </div>
    </>
  );
}

function resumirNavegador(ua: string | null) {
  if (!ua) return "-";
  const so = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  const nav = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  return `${nav}${so ? ` · ${so}` : ""}`;
}
