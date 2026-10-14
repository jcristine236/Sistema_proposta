import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { TIPOS_CAMPO, type Campo } from "@/lib/campos";
import { TIPOS_SECAO, type Secao } from "@/lib/secoes";
import { dataBR } from "@/lib/formato";

export default async function Modelos() {
  const { empresa } = await exigirSessao();
  const modelos = await db.modelo.findMany({
    where: { empresaId: empresa.id },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { propostas: true } } },
  });
  return (
    <>
      <div className="topo"><div><h1>Modelos</h1><p>Cada modelo é um tipo de solução da {empresa.nome}: formulário próprio, cálculo e visual da proposta.</p></div></div>
      <div className="grade g3">
        {modelos.map((m) => (
          <Link key={m.id} href={`/admin/modelos/${m.id}`} className="card" style={{ textDecoration: "none", opacity: m.ativo ? 1 : 0.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span className="chip">{m.tipoSolucao}</span>
              {!m.ativo && <span className="status">Inativo</span>}
            </div>
            <h2 style={{ margin: "10px 0 6px" }}>{m.nome}</h2>
            <p className="muted" style={{ margin: "0 0 10px" }}>{m.descricao}</p>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {(m.campos as Campo[]).length} campos · {(m.secoes as Secao[]).length} seções · {m._count.propostas} propostas · atualizado {dataBR(m.atualizadoEm)}
            </div>
          </Link>
        ))}
      </div>

      <div className="grade g2" style={{ marginTop: 24 }}>
        <div className="card">
          <h2>Tipos de campo do formulário</h2>
          <p className="muted" style={{ marginTop: -6 }}>Blocos disponíveis para montar o formulário de preenchimento de qualquer modelo.</p>
          <div className="tabela-wrap">
            <table className="tabela">
              <tbody>
                {TIPOS_CAMPO.map((t) => (
                  <tr key={t.tipo}><td style={{ width: 170 }}><b>{t.nome}</b><br /><span className="mono muted" style={{ fontSize: 12 }}>{t.tipo}</span></td><td className="muted">{t.descricao}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2>Tipos de seção da proposta</h2>
          <p className="muted" style={{ marginTop: -6 }}>Blocos visuais que compõem a página que o cliente vê. Os textos aceitam variáveis como <span className="mono">{"{{cliente}}"}</span>.</p>
          <div className="tabela-wrap">
            <table className="tabela">
              <tbody>
                {TIPOS_SECAO.map((t) => (
                  <tr key={t.tipo}><td style={{ width: 170 }}><b>{t.nome}</b><br /><span className="mono muted" style={{ fontSize: 12 }}>{t.tipo}</span></td><td className="muted">{t.descricao}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
