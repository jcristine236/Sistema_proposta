"use client";

// Tela "Nova proposta": formulário do modelo + resumo financeiro ao vivo +
// aba de prévia mostrando exatamente o que o cliente verá.

import { useMemo, useState } from "react";
import Link from "next/link";
import { valoresPadrao, validar, type Campo, type Dados } from "@/lib/campos";
import { montarContexto, type EmpresaPublica } from "@/lib/contexto";
import type { Precificacao, ProdutoCatalogo } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import type { Tema } from "@/lib/tema";
import { brl } from "@/lib/formato";
import { PropostaView } from "@/components/proposta/PropostaView";
import { CamposFormulario } from "./CamposFormulario";
import { criarProposta, editarProposta } from "@/app/admin/propostas/acoes";

type Props = {
  modelo: { id: string; nome: string; campos: Campo[]; secoes: Secao[]; precificacao: Precificacao };
  catalogo: ProdutoCatalogo[];
  contatos: { id: string; organizacao: string }[];
  empresa: EmpresaPublica;
  tema: Tema;
  dominio: string;
  /** Edição de proposta existente */
  editar?: { id: string; codigo: string };
  /** Valores iniciais (edição ou duplicação) */
  dadosIniciais?: Dados;
};

export function FormularioProposta({ modelo, catalogo, contatos, empresa, tema, dominio, editar, dadosIniciais }: Props) {
  const [dados, setDados] = useState<Dados>(() => ({ ...valoresPadrao(modelo.campos), ...(dadosIniciais ?? {}) }));
  const [aba, setAba] = useState<"form" | "previa">("form");
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [gerada, setGerada] = useState<{ id: string; link: string; codigo: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const ctx = useMemo(
    () => montarContexto({ campos: modelo.campos, precificacao: modelo.precificacao, dados, catalogo, empresa }),
    [dados, modelo, catalogo, empresa],
  );
  const c = ctx.calc;
  const alterar = (id: string, valor: unknown) => {
    setDados((d) => ({ ...d, [id]: valor }));
    setGerada(null);
  };

  async function gerar() {
    const e = validar(modelo.campos, dados);
    setErros(e);
    if (e.length) return;
    setEnviando(true);
    const r = editar ? await editarProposta(editar.id, dados) : await criarProposta(modelo.id, dados);
    setEnviando(false);
    if ("erros" in r) setErros(r.erros);
    else setGerada(r);
  }

  return (
    <>
      <div className="topo">
        <div>
          <h1>{editar ? `Editar proposta ${editar.codigo}` : `Nova proposta · ${modelo.nome}`}</h1>
          <p>Preencha os dados, confira o resumo e gere o link. A aba “Prévia” mostra exatamente o que o cliente vai ver.</p>
        </div>
        <div className="abas">
          <button type="button" className={aba === "form" ? "on" : ""} onClick={() => setAba("form")}>1. Dados</button>
          <button type="button" className={aba === "previa" ? "on" : ""} onClick={() => { setAba("previa"); window.scrollTo({ top: 0 }); }}>2. Prévia (cliente vê)</button>
        </div>
      </div>

      {aba === "previa" ? (
        <div className="previa-moldura">
          <PropostaView secoes={modelo.secoes} ctx={ctx} tema={tema} modo="previa" avisoPrevia={`Prévia · link final em ${dominio}`} />
        </div>
      ) : (
        <div className="grade g2">
          <div className="card">
            <h2>Dados da proposta</h2>
            <CamposFormulario campos={modelo.campos} dados={dados} alterar={alterar} catalogo={catalogo} contatos={contatos} descontoPct={c.desconto.pct} />
            {erros.length > 0 && <div className="alerta erro">{erros.map((e) => <div key={e}>{e}</div>)}</div>}
            <button className="btn destaque" type="button" onClick={gerar} disabled={enviando} style={{ marginTop: 6 }}>
              {enviando ? "Salvando..." : editar ? "Salvar alterações" : "Gerar link da proposta"}
            </button>
            {gerada && (
              <div className="link-box">
                <strong>{editar ? "Alterações salvas. O link continua o mesmo:" : `Proposta ${gerada.codigo} criada. Link pronto para enviar:`}</strong>
                <code>{gerada.link}</code>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn claro pequeno"
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(gerada.link).catch(() => {});
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                  >
                    {copiado ? "Copiado!" : "Copiar link"}
                  </button>
                  <a className="btn claro pequeno" href={gerada.link} target="_blank" rel="noreferrer">Abrir</a>
                  <Link className="btn claro pequeno" href={`/admin/propostas/${gerada.id}`}>Acompanhar</Link>
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="card resumo">
              <h2>Resumo financeiro</h2>
              <div className="l"><span>{c.base.rotulo}</span><b>{brl(c.base.valor)}</b></div>
              {c.adicionais.map((a) => (
                <div key={a.campo} className="l">
                  <span>{a.extras > 0 ? `${a.extras} ${a.rotulo} × ${brl(a.valorUnitario)}` : `${a.rotuloLinha} (${a.inclusos} inclusos)`}</span>
                  <b>{brl(a.valor)}</b>
                </div>
              ))}
              <div className="l"><span>Desconto</span><b>{c.desconto.valor > 0 ? `- ${brl(c.desconto.valor)}` : "nenhum"}</b></div>
              {c.unicos.map((u) => <div key={u.rotulo} className="l"><span>{u.rotulo}</span><b>{brl(u.valor)}</b></div>)}
              <div className="total"><small>Mensalidade final</small><strong>{brl(c.totalMensal)}</strong></div>
            </div>
            <div className="card">
              <h2>O que acontece depois</h2>
              <div className="passos">
                <div>O cliente abre o link e vê a proposta personalizada.</div>
                <div>Você é avisado por e-mail quando ele abrir, aceitar, recusar ou comentar.</div>
                <div>O tempo de leitura de cada seção aparece no acompanhamento da proposta.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
