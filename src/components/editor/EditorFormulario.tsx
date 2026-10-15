"use client";

// Abas "Formulário" (campos que o vendedor preenche) e "Cálculo" do editor de modelos.

import type { CampoBloco } from "@/lib/blocos";
import { TIPOS_CAMPO, type Campo, type TipoCampo } from "@/lib/campos";
import type { Precificacao } from "@/lib/precificacao";
import { CamposBloco } from "./CamposBloco";
import { useState } from "react";

const COMUNS: CampoBloco[] = [
  { k: "rotulo", rotulo: "Rótulo", tipo: "texto" },
  { k: "id", rotulo: "Variável (usada nos textos como {{variavel}})", tipo: "texto", ajuda: "Letras e números, sem espaços. Ex.: dispositivos" },
  { k: "obrigatorio", rotulo: "Obrigatório", tipo: "bool" },
  { k: "largura", rotulo: "Largura", tipo: "select", opcoes: [{ v: "inteira", r: "Linha inteira" }, { v: "meia", r: "Meia linha (lado a lado)" }] },
  { k: "ajuda", rotulo: "Texto de ajuda", tipo: "texto" },
];

const POR_TIPO: Partial<Record<TipoCampo, CampoBloco[]>> = {
  texto: [{ k: "padrao", rotulo: "Valor inicial", tipo: "texto" }, { k: "placeholder", rotulo: "Exemplo no campo vazio", tipo: "texto" }],
  textoLongo: [{ k: "padrao", rotulo: "Valor inicial", tipo: "textoLongo" }],
  numero: [{ k: "padrao", rotulo: "Valor inicial", tipo: "numero" }, { k: "min", rotulo: "Mínimo", tipo: "numero" }, { k: "max", rotulo: "Máximo", tipo: "numero" }],
  moeda: [{ k: "padrao", rotulo: "Valor inicial (R$)", tipo: "numero" }],
  data: [{ k: "padraoDias", rotulo: "Padrão: hoje + quantos dias", tipo: "numero" }],
  checkbox: [{ k: "padrao", rotulo: "Marcado por padrão", tipo: "bool" }],
  selecao: [{ k: "opcoes", rotulo: "Opções", tipo: "lista", titulo: "rotulo", novo: { valor: "opcao", rotulo: "Opção" },
    itens: [{ k: "rotulo", rotulo: "Texto", tipo: "texto" }, { k: "valor", rotulo: "Valor", tipo: "texto" }] }],
  produto: [
    { k: "categoria", rotulo: "Categoria do catálogo", tipo: "texto", ajuda: "Itens cadastrados em Produtos e planos com esta categoria" },
    { k: "padrao", rotulo: "Código do item escolhido por padrão", tipo: "texto" },
    { k: "personalizado.rotulo", rotulo: "Opção personalizada (deixe vazio para não oferecer)", tipo: "texto" },
    { k: "personalizado.atributos", rotulo: "Atributos editáveis no personalizado", tipo: "lista", titulo: "rotulo", novo: { id: "atributo", rotulo: "Atributo" },
      itens: [{ k: "rotulo", rotulo: "Rótulo", tipo: "texto" }, { k: "id", rotulo: "Atributo do produto", tipo: "texto" }] },
    { k: "personalizado.nota", rotulo: "Nota do personalizado", tipo: "textoLongo" },
  ],
  desconto: [{ k: "limitePct", rotulo: "Alerta acima de (%)", tipo: "numero" }],
  lista: [{ k: "max", rotulo: "Máximo de itens", tipo: "numero" }, { k: "rotuloTitulo", rotulo: "Exemplo do título", tipo: "texto" }, { k: "rotuloDescricao", rotulo: "Exemplo da descrição", tipo: "texto" }],
};

const NOME_TIPO = Object.fromEntries(TIPOS_CAMPO.map((t) => [t.tipo, t.nome]));

export function EditorCampos({ campos, onChange }: { campos: Campo[]; onChange: (c: Campo[]) => void }) {
  const [sel, setSel] = useState<number | null>(campos.length ? 0 : null);
  const [novoTipo, setNovoTipo] = useState<TipoCampo>("texto");
  const atual = sel !== null ? campos[sel] : null;

  const adicionar = () => {
    let id = novoTipo === "contato" ? "cliente" : novoTipo;
    for (let n = 2; campos.some((c) => c.id === id); n++) id = `${novoTipo}${n}`;
    const base = { id, tipo: novoTipo, rotulo: NOME_TIPO[novoTipo] } as Campo;
    const extra: Partial<Record<TipoCampo, object>> = {
      selecao: { opcoes: [{ valor: "a", rotulo: "Opção A" }, { valor: "b", rotulo: "Opção B" }] },
      produto: { categoria: "planos" }, data: { padraoDias: 15 }, desconto: { limitePct: 15 }, lista: { max: 8 },
    };
    onChange([...campos, { ...base, ...(extra[novoTipo] ?? {}) } as Campo]);
    setSel(campos.length);
  };
  const mover = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= campos.length) return;
    const l = [...campos];
    [l[i], l[j]] = [l[j], l[i]];
    onChange(l);
    setSel(j);
  };

  return (
    <div className="ed-form">
      <div className="card">
        <h2>Campos do formulário</h2>
        <p className="muted" style={{ marginTop: -8 }}>O que o vendedor preenche ao criar a proposta. Cada campo vira uma variável para os textos.</p>
        <div className="ed-lista">
          {campos.map((c, i) => (
            <div key={i} className={`ed-item ${sel === i ? "aberto" : ""}`}>
              <div className="ed-item-topo" onClick={() => setSel(i)}>
                <span><b>{c.rotulo}</b> <span className="muted">· {NOME_TIPO[c.tipo]} · <span className="mono">{`{{${c.id}}}`}</span></span></span>
                <span className="ed-item-acoes" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => mover(i, -1)}>↑</button>
                  <button type="button" onClick={() => mover(i, 1)}>↓</button>
                  <button type="button" onClick={() => { onChange(campos.filter((_, j) => j !== i)); setSel(null); }}>×</button>
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoCampo)} style={{ height: 36, borderRadius: 9, border: "1.5px solid var(--line)", padding: "0 8px" }}>
            {TIPOS_CAMPO.map((t) => <option key={t.tipo} value={t.tipo}>{t.nome}</option>)}
          </select>
          <button type="button" className="btn pequeno" onClick={adicionar}>+ Adicionar campo</button>
        </div>
      </div>
      <div className="card">
        {atual ? (
          <>
            <h2>{atual.rotulo} <span className="chip">{NOME_TIPO[atual.tipo]}</span></h2>
            <CamposBloco
              campos={[...COMUNS, ...(POR_TIPO[atual.tipo] ?? [])]}
              valor={atual as unknown as Record<string, unknown>}
              camposForm={campos}
              onChange={(v) => onChange(campos.map((c, j) => (j === sel ? (v as unknown as Campo) : c)))}
            />
          </>
        ) : (
          <div className="vazio">Selecione um campo para editar.</div>
        )}
      </div>
    </div>
  );
}

export function EditorCalculo({ campos, prec, onChange }: { campos: Campo[]; prec: Precificacao; onChange: (p: Precificacao) => void }) {
  const de = (tipos: TipoCampo[]) => campos.filter((c) => tipos.includes(c.tipo));
  const sel = (valor: string | undefined, opcoes: Campo[], set: (v: string) => void, vazio = "Nenhum") => (
    <select value={valor ?? ""} onChange={(e) => set(e.target.value)}>
      <option value="">{vazio}</option>
      {opcoes.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
    </select>
  );
  const adicionais = prec.recorrente?.adicionais ?? [];
  const setRec = (r: Precificacao["recorrente"]) => onChange({ ...prec, recorrente: r });
  const setAd = (l: NonNullable<Precificacao["recorrente"]>["adicionais"]) =>
    setRec({ base: prec.recorrente?.base ?? { campo: "" }, adicionais: l });

  return (
    <div className="ed-form">
      <div className="card">
        <h2>Mensalidade</h2>
        <div className="campo">
          <label>Valor base vem do campo</label>
          {sel(prec.recorrente?.base.campo, de(["produto", "moeda"]), (v) => setRec(v ? { base: { campo: v }, adicionais } : undefined), "Sem mensalidade")}
          <div className="ajuda">Um campo “Produto/Plano” (usa o preço do catálogo) ou “Valor (R$)”.</div>
        </div>
        <h2 style={{ marginTop: 18 }}>Adicionais por quantidade</h2>
        {adicionais.map((a, i) => {
          const up = (p: Partial<typeof a>) => setAd(adicionais.map((x, j) => (j === i ? { ...x, ...p } : x)));
          return (
            <div key={i} className="caixa-destaque">
              <div className="linha2">
                <div className="campo"><label>Quantidade vem do campo</label>{sel(a.campo, de(["numero"]), (v) => up({ campo: v }))}</div>
                <div className="campo"><label>Inclusos</label><input type="number" value={a.inclusos} onChange={(e) => up({ inclusos: Number(e.target.value) })} /></div>
              </div>
              <div className="linha2">
                <div className="campo"><label>Valor por adicional (R$)</label><input type="number" step="0.01" value={a.valorUnitario} onChange={(e) => up({ valorUnitario: Number(e.target.value) })} /></div>
                <div className="campo"><label>Linha na proposta</label><input value={a.rotuloLinha} onChange={(e) => up({ rotuloLinha: e.target.value })} /></div>
              </div>
              <div className="linha2">
                <div className="campo"><label>Unidade (singular / plural)</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={a.unidade[0]} onChange={(e) => up({ unidade: [e.target.value, a.unidade[1]] })} />
                    <input value={a.unidade[1]} onChange={(e) => up({ unidade: [a.unidade[0], e.target.value] })} />
                  </div>
                </div>
                <div className="campo"><label>No resumo (singular / plural)</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={a.rotuloSingular} onChange={(e) => up({ rotuloSingular: e.target.value })} />
                    <input value={a.rotuloPlural} onChange={(e) => up({ rotuloPlural: e.target.value })} />
                  </div>
                </div>
              </div>
              <button type="button" className="btn claro pequeno" onClick={() => setAd(adicionais.filter((_, j) => j !== i))}>Remover adicional</button>
            </div>
          );
        })}
        <button type="button" className="btn claro pequeno" disabled={!prec.recorrente} onClick={() => setAd([...adicionais, { campo: "", inclusos: 0, valorUnitario: 0, rotuloLinha: "Quantidade", unidade: ["item", "itens"], rotuloSingular: "item adicional", rotuloPlural: "itens adicionais" }])}>
          + Adicional por quantidade
        </button>
      </div>
      <div className="card">
        <h2>Desconto</h2>
        <div className="linha2">
          <div className="campo"><label>Campo de desconto</label>{sel(prec.desconto?.campo, de(["desconto"]), (v) => onChange({ ...prec, desconto: v ? { campo: v, limitePct: prec.desconto?.limitePct } : undefined }))}</div>
          <div className="campo"><label>Alerta acima de (%)</label><input type="number" value={prec.desconto?.limitePct ?? ""} disabled={!prec.desconto} onChange={(e) => prec.desconto && onChange({ ...prec, desconto: { ...prec.desconto, limitePct: e.target.value === "" ? undefined : Number(e.target.value) } })} /></div>
        </div>
        <h2 style={{ marginTop: 18 }}>Valores únicos</h2>
        <p className="muted" style={{ marginTop: -8 }}>Cobrados uma vez (implantação, setup...).</p>
        {(prec.unicos ?? []).map((u, i) => (
          <div key={i} className="linha2" style={{ alignItems: "end" }}>
            <div className="campo"><label>Campo (R$)</label>{sel(u.campo, de(["moeda"]), (v) => onChange({ ...prec, unicos: prec.unicos!.map((x, j) => (j === i ? { ...x, campo: v } : x)) }))}</div>
            <div className="campo"><label>Rótulo</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={u.rotulo} onChange={(e) => onChange({ ...prec, unicos: prec.unicos!.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)) })} />
                <button type="button" className="btn claro pequeno" style={{ height: 40 }} onClick={() => onChange({ ...prec, unicos: prec.unicos!.filter((_, j) => j !== i) })}>×</button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn claro pequeno" onClick={() => onChange({ ...prec, unicos: [...(prec.unicos ?? []), { campo: "", rotulo: "Implantação (única)" }] })}>+ Valor único</button>
      </div>
    </div>
  );
}
