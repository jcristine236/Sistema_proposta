import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { brl, dataHoraBR, duracao } from "@/lib/formato";
import { EVENTOS, STATUS } from "@/lib/rotulos";

export default async function Painel() {
  const { empresa } = await exigirSessao();
  const desde = new Date();
  desde.setDate(desde.getDate() - 90);
  const propostas = await db.proposta.findMany({
    where: { empresaId: empresa.id, criadoEm: { gte: desde } },
    select: { id: true, status: true, valorMensal: true, primeiraAberturaEm: true, visualizacoes: { select: { tempoTotalSeg: true } } },
  });
  const enviadas = propostas.length;
  const abertas = propostas.filter((p) => p.primeiraAberturaEm).length;
  const aceitas = propostas.filter((p) => p.status === "ACEITA");
  const tempos = propostas.map((p) => p.visualizacoes.reduce((s, v) => s + v.tempoTotalSeg, 0)).filter((t) => t > 0);
  const soma = (l: typeof propostas) => l.reduce((s, p) => s + Number(p.valorMensal ?? 0), 0);

  const eventos = await db.evento.findMany({
    where: { proposta: { empresaId: empresa.id }, tipo: { not: "CRIADA" } },
    orderBy: { criadoEm: "desc" },
    take: 12,
    include: { proposta: { select: { id: true, clienteNome: true } } },
  });
  const pendentes = await db.proposta.findMany({
    where: { empresaId: empresa.id, status: "PUBLICADA" },
    orderBy: { publicadaEm: "asc" },
    take: 6,
  });

  const kpis = [
    { rotulo: "Propostas enviadas", valor: String(enviadas), sub: "últimos 90 dias" },
    { rotulo: "Taxa de abertura", valor: enviadas ? `${Math.round((abertas / enviadas) * 100)}%` : "-", sub: `${abertas} abertas` },
    { rotulo: "Conversão", valor: enviadas ? `${Math.round((aceitas.length / enviadas) * 100)}%` : "-", sub: `${aceitas.length} aceitas` },
    { rotulo: "Tempo médio de leitura", valor: tempos.length ? duracao(tempos.reduce((a, b) => a + b, 0) / tempos.length) : "-", sub: "por proposta aberta" },
    { rotulo: "Mensalidade enviada", valor: brl(soma(propostas)), sub: "soma das propostas" },
    { rotulo: "Mensalidade fechada", valor: brl(soma(aceitas)), sub: "propostas aceitas" },
    { rotulo: "Ticket médio", valor: enviadas ? brl(soma(propostas) / enviadas) : "-", sub: "mensal" },
    { rotulo: "Aguardando abertura", valor: String(pendentes.length), sub: "enviadas e não abertas" },
  ];

  return (
    <>
      <div className="topo">
        <div>
          <h1>Painel · {empresa.nome}</h1>
          <p>Acompanhe abertura, leitura e fechamento das propostas.</p>
        </div>
        <Link className="btn destaque" href="/admin/propostas/nova">+ Nova proposta</Link>
      </div>
      <div className="grade g4">
        {kpis.map((k) => (
          <div key={k.rotulo} className="card kpi"><small>{k.rotulo}</small><b>{k.valor}</b><span>{k.sub}</span></div>
        ))}
      </div>
      <div className="grade g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Atividade recente</h2>
          {eventos.length === 0 && <div className="vazio">Nenhuma atividade ainda. Envie uma proposta para começar.</div>}
          <div className="linha-tempo">
            {eventos.map((e) => (
              <div key={e.id}>
                <span className="muted">{dataHoraBR(e.criadoEm)}</span>
                <span>
                  {EVENTOS[e.tipo] ?? e.tipo} · <Link href={`/admin/propostas/${e.proposta.id}`}><b>{e.proposta.clienteNome}</b></Link>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Ainda não abertas</h2>
          {pendentes.length === 0 && <div className="vazio">Tudo em dia.</div>}
          <div className="linha-tempo">
            {pendentes.map((p) => (
              <div key={p.id}>
                <span className="muted">{dataHoraBR(p.publicadaEm)}</span>
                <span><Link href={`/admin/propostas/${p.id}`}><b>{p.clienteNome}</b></Link> <span className={`status ${p.status}`}>{STATUS[p.status]}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
