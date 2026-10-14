"use client";

// Renderiza os campos de preenchimento definidos no modelo (src/lib/campos.ts).

import type { Campo, Dados, ItemLista, ValorContato, ValorDesconto, ValorProduto } from "@/lib/campos";
import type { ProdutoCatalogo } from "@/lib/precificacao";
import { brl } from "@/lib/formato";

type Props = {
  campos: Campo[];
  dados: Dados;
  alterar: (id: string, valor: unknown) => void;
  catalogo: ProdutoCatalogo[];
  contatos: { id: string; organizacao: string }[];
  /** % de desconto calculado (para o alerta de limite) */
  descontoPct?: number;
};

export function CamposFormulario({ campos, dados, alterar, catalogo, contatos, descontoPct = 0 }: Props) {
  // Agrupa campos "meia" largura em pares lado a lado
  const linhas: Campo[][] = [];
  for (const c of campos) {
    const ult = linhas[linhas.length - 1];
    if (c.largura === "meia" && ult?.length === 1 && ult[0].largura === "meia") ult.push(c);
    else linhas.push([c]);
  }
  return (
    <>
      {linhas.map((l, i) =>
        l.length === 2 ? (
          <div key={i} className="linha2">
            {l.map((c) => <UmCampo key={c.id} c={c} {...{ dados, alterar, catalogo, contatos, descontoPct }} />)}
          </div>
        ) : (
          <UmCampo key={l[0].id} c={l[0]} {...{ dados, alterar, catalogo, contatos, descontoPct }} />
        ),
      )}
    </>
  );
}

function UmCampo({ c, dados, alterar, catalogo, contatos, descontoPct }: Omit<Props, "campos"> & { c: Campo }) {
  const v = dados[c.id];
  const id = `f-${c.id}`;
  const num = (x: string) => (x === "" ? 0 : Number(x));
  const rotulo = <label htmlFor={id}>{c.rotulo}{c.obrigatorio && " *"}</label>;
  const ajuda = c.ajuda && <div className="ajuda">{c.ajuda}</div>;

  switch (c.tipo) {
    case "contato": {
      const val = (v as ValorContato) ?? { nome: "" };
      return (
        <div className="campo">
          {rotulo}
          <input
            id={id}
            list={`${id}-lista`}
            value={val.nome}
            placeholder="Digite ou escolha um cliente cadastrado"
            onChange={(e) => {
              const nome = e.target.value;
              const existente = contatos.find((x) => x.organizacao.toLowerCase() === nome.trim().toLowerCase());
              alterar(c.id, { nome, contatoId: existente?.id } satisfies ValorContato);
            }}
          />
          <datalist id={`${id}-lista`}>{contatos.map((x) => <option key={x.id} value={x.organizacao} />)}</datalist>
          <div className="ajuda">{val.contatoId ? "Cliente já cadastrado." : val.nome.trim() ? "Novo cliente: será cadastrado ao gerar a proposta." : ""}</div>
        </div>
      );
    }
    case "texto":
      return (
        <div className="campo">{rotulo}
          <input id={id} value={(v as string) ?? ""} maxLength={c.maxLength} placeholder={c.placeholder} onChange={(e) => alterar(c.id, e.target.value)} />{ajuda}
        </div>
      );
    case "textoLongo":
      return (
        <div className="campo">{rotulo}
          <textarea id={id} value={(v as string) ?? ""} placeholder={c.placeholder} onChange={(e) => alterar(c.id, e.target.value)} />{ajuda}
        </div>
      );
    case "numero":
      return (
        <div className="campo">{rotulo}
          <input id={id} type="number" min={c.min} max={c.max} step={c.passo ?? 1} value={String(v ?? "")} onChange={(e) => alterar(c.id, num(e.target.value))} />{ajuda}
        </div>
      );
    case "moeda":
      return (
        <div className="campo">{rotulo}
          <input id={id} type="number" min={0} step={c.passo ?? 0.01} value={String(v ?? "")} onChange={(e) => alterar(c.id, num(e.target.value))} />{ajuda}
        </div>
      );
    case "data":
      return (
        <div className="campo">{rotulo}
          <input id={id} type="date" value={(v as string) ?? ""} onChange={(e) => alterar(c.id, e.target.value)} />{ajuda}
        </div>
      );
    case "selecao":
      return (
        <div className="campo">{rotulo}
          <select id={id} value={(v as string) ?? ""} onChange={(e) => alterar(c.id, e.target.value)}>
            {c.opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>{ajuda}
        </div>
      );
    case "checkbox":
      return (
        <div className="campo">
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
            <input type="checkbox" checked={!!v} onChange={(e) => alterar(c.id, e.target.checked)} style={{ width: 18, height: 18 }} />
            {c.rotulo}
          </label>{ajuda}
        </div>
      );
    case "produto": {
      const val = (v as ValorProduto) ?? { codigo: "" };
      const itens = catalogo.filter((p) => p.categoria === c.categoria);
      const personalizado = val.codigo === "personalizado";
      const escolher = (codigo: string) => {
        if (codigo === "personalizado") {
          // Começa com os valores do plano escolhido antes
          const base = itens.find((p) => p.codigo === val.codigo) ?? itens[0];
          const atributos = Object.fromEntries((c.personalizado?.atributos ?? []).map((a) => [a.id, Number(base?.atributos[a.id] ?? 0)]));
          alterar(c.id, { codigo, personalizado: { nome: "Personalizado", preco: base?.preco ?? 0, atributos } });
        } else alterar(c.id, { ...val, codigo });
      };
      const p = val.personalizado;
      const setP = (patch: Partial<NonNullable<ValorProduto["personalizado"]>>) =>
        alterar(c.id, { ...val, personalizado: { nome: p?.nome ?? "", preco: p?.preco ?? 0, atributos: p?.atributos ?? {}, ...patch } });
      return (
        <>
          <div className="campo">{rotulo}
            <select id={id} value={val.codigo} onChange={(e) => escolher(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {itens.map((x) => (
                <option key={x.codigo} value={x.codigo}>{x.nome}{x.descricao ? `: ${x.descricao}` : ""} · {brl(x.preco)}</option>
              ))}
              {c.personalizado && <option value="personalizado">{c.personalizado.rotulo}</option>}
            </select>
            {itens.length === 0 && <div className="ajuda">Nenhum item na categoria “{c.categoria}”. Cadastre em Produtos e planos.</div>}
            {ajuda}
          </div>
          {personalizado && c.personalizado && p && (
            <div className="caixa-destaque">
              <div className="titulo">Plano personalizado</div>
              <div className="linha2">
                <div className="campo"><label>Nome do plano</label><input value={p.nome} maxLength={40} onChange={(e) => setP({ nome: e.target.value })} /></div>
                <div className="campo"><label>Mensalidade base (R$)</label><input type="number" min={0} value={p.preco} onChange={(e) => setP({ preco: num(e.target.value) })} /></div>
              </div>
              <div className="linha2">
                {c.personalizado.atributos.map((a) => (
                  <div key={a.id} className="campo">
                    <label>{a.rotulo}</label>
                    <input type="number" min={1} value={p.atributos[a.id] ?? 0} onChange={(e) => setP({ atributos: { ...p.atributos, [a.id]: num(e.target.value) } })} />
                  </div>
                ))}
              </div>
              {c.personalizado.nota && <div className="ajuda" style={{ marginBottom: 12 }}>{c.personalizado.nota}</div>}
            </div>
          )}
        </>
      );
    }
    case "desconto": {
      const val = (v as ValorDesconto) ?? { tipo: "nenhum", valor: 0 };
      return (
        <>
          <div className="linha2">
            <div className="campo"><label htmlFor={id}>{c.rotulo}</label>
              <select id={id} value={val.tipo} onChange={(e) => alterar(c.id, { ...val, tipo: e.target.value })}>
                <option value="nenhum">Sem desconto</option>
                <option value="pct">Percentual (%)</option>
                <option value="valor">Valor fixo (R$)</option>
              </select>
            </div>
            <div className="campo"><label>Valor do desconto</label>
              <input type="number" min={0} step={0.5} disabled={val.tipo === "nenhum"} value={val.valor} onChange={(e) => alterar(c.id, { ...val, valor: num(e.target.value) })} />
            </div>
          </div>
          {c.limitePct !== undefined && (descontoPct ?? 0) > c.limitePct && (
            <div className="alerta aviso">Desconto acima de {c.limitePct}% da mensalidade. Confirme a aprovação antes de enviar.</div>
          )}
        </>
      );
    }
    case "lista": {
      const itens = (v as ItemLista[]) ?? [];
      const max = c.max ?? 8;
      const set = (l: ItemLista[]) => alterar(c.id, l);
      return (
        <div className="campo">
          <label>{c.rotulo}</label>
          {itens.map((it, i) => (
            <div key={i} className="lista-item">
              <input placeholder={c.rotuloTitulo ?? "Título"} maxLength={60} value={it.titulo} onChange={(e) => set(itens.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))} />
              <input placeholder={c.rotuloDescricao ?? "Descrição"} maxLength={300} value={it.descricao} onChange={(e) => set(itens.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))} />
              <button type="button" aria-label="Remover" onClick={() => set(itens.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {itens.length < max && (
            <button type="button" className="btn claro pequeno" onClick={() => set([...itens, { titulo: "", descricao: "" }])}>+ Adicionar campo</button>
          )}
          {ajuda}
        </div>
      );
    }
  }
}
