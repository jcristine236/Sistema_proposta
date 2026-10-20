// Motor de cálculo do investimento. Função pura: roda igual no navegador
// (resumo ao vivo no formulário) e no servidor (valor gravado na proposta).

import type { Campo, Dados, ItemAdicional, ValorDesconto, ValorProduto } from "./campos";

export type Precificacao = {
  recorrente?: {
    /** Campo do tipo "produto" ou "moeda" que define a mensalidade base */
    base: { campo: string };
    /** Cobrança por quantidade acima de uma franquia (ex.: 5 dispositivos inclusos) */
    adicionais?: {
      campo: string;
      inclusos: number;
      valorUnitario: number;
      /** Ex.: "dispositivo adicional" / "dispositivos adicionais" (resumo do painel) */
      rotuloSingular: string;
      rotuloPlural: string;
      /** Linha na proposta (ex.: "Dispositivos acessantes") e unidade ("dispositivo"/"dispositivos") */
      rotuloLinha: string;
      unidade: [string, string];
    }[];
    /** Adicionais livres precificados na proposta (campo do tipo "adicionais") */
    extras?: { campo: string };
  };
  desconto?: { campo: string; limitePct?: number };
  /** Valores cobrados uma única vez (ex.: implantação) */
  unicos?: { campo: string; rotulo: string }[];
};

/** Produto já serializado para o cliente (preço em número). */
export type ProdutoCatalogo = {
  id: string;
  categoria: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  atributos: Record<string, number | string>;
};

export type ProdutoResolvido = { codigo: string; nome: string; preco: number; atributos: Record<string, number | string> };

export type Calculo = {
  base: { rotulo: string; valor: number; produto?: ProdutoResolvido };
  adicionais: { campo: string; quantidade: number; inclusos: number; extras: number; valorUnitario: number; rotulo: string; rotuloLinha: string; unidade: string; valor: number }[];
  extras: { nome: string; quantidade: number; valorUnit: number; valor: number }[];
  subtotal: number;
  desconto: { tipo: ValorDesconto["tipo"]; informado: number; valor: number; pct: number; acimaLimite: boolean; limitePct?: number };
  totalMensal: number;
  unicos: { rotulo: string; valor: number }[];
  totalUnico: number;
};

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const arred = (v: number) => Math.round(v * 100) / 100;

/** Mantém no catálogo só os produtos das categorias usadas pelos campos "produto"
 *  do modelo. Evita que planos de categorias diferentes com o mesmo código se
 *  confundam (ex.: "intermediario" existe em vários segmentos da FASE). */
export function catalogoDoModelo(campos: Campo[], catalogo: ProdutoCatalogo[]): ProdutoCatalogo[] {
  const cats = new Set(campos.filter((c) => c.tipo === "produto").map((c) => (c as { categoria: string }).categoria));
  return cats.size ? catalogo.filter((p) => cats.has(p.categoria)) : catalogo;
}

export function resolverProduto(valor: ValorProduto | undefined, catalogo: ProdutoCatalogo[]): ProdutoResolvido | undefined {
  if (!valor?.codigo) return undefined;
  if (valor.codigo === "personalizado" && valor.personalizado) {
    const p = valor.personalizado;
    return { codigo: "personalizado", nome: p.nome?.trim() || "Personalizado", preco: num(p.preco), atributos: p.atributos ?? {} };
  }
  const p = catalogo.find((x) => x.codigo === valor.codigo);
  // num() garante número mesmo se o preço vier como Decimal do Prisma ou string
  // (um Decimal somado vira texto e multiplicaria o valor).
  return p ? { codigo: p.codigo, nome: p.nome, preco: num(p.preco), atributos: p.atributos } : undefined;
}

export function calcular(regras: Precificacao, dados: Dados, catalogo: ProdutoCatalogo[]): Calculo {
  let base: Calculo["base"] = { rotulo: "Mensalidade", valor: 0 };
  if (regras.recorrente) {
    const v = dados[regras.recorrente.base.campo];
    if (v && typeof v === "object" && "codigo" in (v as object)) {
      const produto = resolverProduto(v as ValorProduto, catalogo);
      base = { rotulo: produto ? `Plano ${produto.nome}` : "Plano", valor: produto?.preco ?? 0, produto };
    } else {
      base = { rotulo: "Mensalidade", valor: num(v) };
    }
  }

  const adicionais = (regras.recorrente?.adicionais ?? []).map((a) => {
    const quantidade = Math.floor(num(dados[a.campo]));
    const extras = Math.max(0, quantidade - a.inclusos);
    return {
      campo: a.campo,
      quantidade,
      inclusos: a.inclusos,
      extras,
      valorUnitario: a.valorUnitario,
      rotulo: extras === 1 ? a.rotuloSingular : a.rotuloPlural,
      rotuloLinha: a.rotuloLinha,
      unidade: quantidade === 1 ? a.unidade[0] : a.unidade[1],
      valor: arred(extras * a.valorUnitario),
    };
  });

  const listaExtras = (regras.recorrente?.extras ? (dados[regras.recorrente.extras.campo] as ItemAdicional[]) : undefined) ?? [];
  const extras = listaExtras
    .filter((e) => e && e.nome?.trim() && num(e.valor) > 0)
    .map((e) => {
      const quantidade = e.quantidade && e.quantidade > 0 ? Math.floor(num(e.quantidade)) : 1;
      const valorUnit = num(e.valor);
      return { nome: e.nome.trim(), quantidade, valorUnit, valor: arred(valorUnit * quantidade) };
    });

  const subtotal = arred(base.valor + adicionais.reduce((s, a) => s + a.valor, 0) + extras.reduce((s, e) => s + e.valor, 0));

  const d = (regras.desconto ? dados[regras.desconto.campo] : undefined) as ValorDesconto | undefined;
  const tipo = d?.tipo ?? "nenhum";
  const informado = num(d?.valor);
  let valorDesc = tipo === "pct" ? (subtotal * informado) / 100 : tipo === "valor" ? informado : 0;
  valorDesc = arred(Math.min(valorDesc, subtotal));
  const pct = subtotal ? (valorDesc / subtotal) * 100 : 0;
  const limitePct = regras.desconto?.limitePct;

  const unicos = (regras.unicos ?? []).map((u) => ({ rotulo: u.rotulo, valor: arred(num(dados[u.campo])) }));

  return {
    base,
    adicionais,
    extras,
    subtotal,
    desconto: { tipo, informado, valor: valorDesc, pct, acimaLimite: limitePct !== undefined && pct > limitePct, limitePct },
    totalMensal: arred(subtotal - valorDesc),
    unicos,
    totalUnico: arred(unicos.reduce((s, u) => s + u.valor, 0)),
  };
}
