import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { TIPOS_CAMPO, valoresPadrao, type Campo } from "@/lib/campos";
import { TIPOS_SECAO, type Secao } from "@/lib/secoes";
import { montarContexto } from "@/lib/contexto";
import type { Precificacao } from "@/lib/precificacao";
import { brl } from "@/lib/formato";
import { temaDe, urlFontes } from "@/lib/tema";
import { PropostaView } from "@/components/proposta/PropostaView";
import { alternarModelo, duplicarModelo } from "../acoes";
import "../../../p/proposta.css";

const nomeCampo = Object.fromEntries(TIPOS_CAMPO.map((t) => [t.tipo, t.nome]));
const nomeSecao = Object.fromEntries(TIPOS_SECAO.map((t) => [t.tipo, t.nome]));

function detalhe(c: Campo) {
  switch (c.tipo) {
    case "produto": return `Catálogo “${c.categoria}”${c.personalizado ? " + personalizado" : ""}`;
    case "numero": return [c.min !== undefined && `mín. ${c.min}`, c.max !== undefined && `máx. ${c.max}`, c.padrao !== undefined && `padrão ${c.padrao}`].filter(Boolean).join(" · ");
    case "moeda": return c.padrao ? `padrão ${brl(c.padrao)}` : "";
    case "data": return `padrão: hoje + ${c.padraoDias ?? 15} dias`;
    case "desconto": return c.limitePct !== undefined ? `alerta acima de ${c.limitePct}%` : "";
    case "lista": return `até ${c.max ?? 8} itens`;
    case "selecao": return c.opcoes.map((o) => o.rotulo).join(", ");
    default: return "";
  }
}

export default async function DetalheModelo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { empresa } = await exigirSessao();
  const m = await db.modelo.findFirst({ where: { id, empresaId: empresa.id } });
  if (!m) notFound();
  const campos = m.campos as Campo[];
  const secoes = m.secoes as Secao[];
  const prec = m.precificacao as Precificacao;
  const catalogo = await catalogoDaEmpresa(empresa.id);
  const tema = temaDe(empresa.tema);
  const ctx = montarContexto({
    campos, precificacao: prec, catalogo,
    dados: { ...valoresPadrao(campos), ...(campos.some((c) => c.id === "cliente") ? { cliente: { nome: "Cliente Exemplo" } } : {}) },
    empresa: { nome: empresa.razaoSocial ?? empresa.nome, site: empresa.site, rodape: empresa.rodape },
  });

  return (
    <>
      <link rel="stylesheet" href={urlFontes(tema)} precedence="default" />
      <div className="topo">
        <div>
          <span className="chip">{m.tipoSolucao}</span>
          <h1 style={{ marginTop: 8 }}>{m.nome}</h1>
          <p>{m.descricao}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {m.ativo && <Link className="btn destaque" href={`/admin/propostas/nova/${m.id}`}>Usar este modelo</Link>}
          <form action={duplicarModelo.bind(null, m.id)}><button className="btn claro">Duplicar</button></form>
          <form action={alternarModelo.bind(null, m.id)}><button className="btn claro">{m.ativo ? "Desativar" : "Ativar"}</button></form>
        </div>
      </div>

      <div className="grade g2">
        <div className="card">
          <h2>Formulário de preenchimento ({campos.length} campos)</h2>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Campo</th><th>Tipo</th><th>Variável</th><th>Regras</th></tr></thead>
              <tbody>
                {campos.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.rotulo}</b>{c.obrigatorio && <span className="muted"> *</span>}</td>
                    <td>{nomeCampo[c.tipo]}</td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{`{{${c.id}}}`}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{detalhe(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2>Regras de cálculo</h2>
          <div className="linha-tempo">
            {prec.recorrente && <div><span className="muted">Mensalidade</span><span>Base pelo campo <b>{campos.find((c) => c.id === prec.recorrente!.base.campo)?.rotulo}</b></span></div>}
            {prec.recorrente?.adicionais?.map((a) => (
              <div key={a.campo}><span className="muted">Adicional</span><span><b>{a.rotuloLinha}</b>: {a.inclusos} inclusos, {brl(a.valorUnitario)} por {a.unidade[0]} adicional</span></div>
            ))}
            {prec.desconto && <div><span className="muted">Desconto</span><span>Percentual ou valor{prec.desconto.limitePct !== undefined && <>, alerta acima de <b>{prec.desconto.limitePct}%</b></>}</span></div>}
            {prec.unicos?.map((u) => <div key={u.campo}><span className="muted">Valor único</span><span><b>{u.rotulo}</b></span></div>)}
          </div>
          <h2 style={{ marginTop: 20 }}>Seções da proposta ({secoes.length})</h2>
          <div className="linha-tempo">
            {secoes.map((s, i) => (
              <div key={s.id}><span className="muted">{String(i + 1).padStart(2, "0")} · {nomeSecao[s.tipo]}</span><span>{s.capitulo ?? s.id}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px" }}>
          <h2 style={{ margin: 0 }}>Prévia com valores padrão</h2>
        </div>
        <PropostaView secoes={secoes} ctx={ctx} tema={tema} modo="previa" avisoPrevia="Prévia do modelo com valores de exemplo" />
      </div>

      <details className="card" style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Definição técnica (JSON)</summary>
        <p className="muted">Usado pelo time técnico para ajustes finos. O editor visual de modelos é a próxima etapa.</p>
        <pre className="json">{JSON.stringify({ campos, precificacao: prec, secoes }, null, 2)}</pre>
      </details>
    </>
  );
}
