// Monta o "contexto" de uma proposta: todos os valores que os textos do modelo
// podem usar com {{...}}, e a função que faz essa substituição.

import type { Campo, Dados, ItemLista, ValorContato, ValorProduto } from "./campos";
import { calcular, resolverProduto, type Calculo, type Precificacao, type ProdutoCatalogo } from "./precificacao";
import { brl, dataBR } from "./formato";

export type EmpresaPublica = {
  nome: string;
  site?: string | null;
  rodape?: string | null;
};

export type Contexto = {
  cliente: string;
  empresa: EmpresaPublica;
  validade: string;
  validadeISO?: string;
  expirada: boolean;
  observacoes: ItemLista[];
  calc: Calculo;
  [campo: string]: unknown;
};

export function montarContexto(opts: {
  campos: Campo[];
  precificacao: Precificacao;
  dados: Dados;
  catalogo: ProdutoCatalogo[];
  empresa: EmpresaPublica;
}): Contexto {
  const { campos, precificacao, dados, catalogo, empresa } = opts;
  const ctx: Record<string, unknown> = {};
  let cliente = "Cliente";
  let validadeISO: string | undefined;
  let observacoes: ItemLista[] = [];

  for (const c of campos) {
    const v = dados[c.id];
    switch (c.tipo) {
      case "contato":
        cliente = (v as ValorContato)?.nome?.trim() || "Cliente";
        ctx[c.id] = cliente;
        break;
      case "produto": {
        const p = resolverProduto(v as ValorProduto, catalogo);
        ctx[c.id] = p ? { nome: p.nome, preco: p.preco, ...p.atributos } : { nome: "-" };
        break;
      }
      case "data":
        validadeISO = (v as string) || undefined;
        ctx[c.id] = dataBR(v as string);
        break;
      case "lista":
        observacoes = ((v as ItemLista[]) ?? []).filter((x) => x.titulo?.trim() && x.descricao?.trim());
        ctx[c.id] = observacoes;
        break;
      default:
        ctx[c.id] = v;
    }
  }

  const expirada = !!validadeISO && new Date(validadeISO + "T23:59:59-03:00") < new Date();

  return {
    ...ctx,
    cliente,
    empresa,
    validade: dataBR(validadeISO),
    validadeISO,
    expirada,
    observacoes,
    calc: calcular(precificacao, dados, catalogo),
  };
}

function caminho(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

const FILTROS: Record<string, (v: unknown) => string> = {
  brl: (v) => brl(Number(v) || 0),
  data: (v) => dataBR(v as string),
  maiusculas: (v) => String(v ?? "").toUpperCase(),
  inteiro: (v) => Math.round(Number(v) || 0).toLocaleString("pt-BR"),
};

/**
 * Substitui {{caminho}} e {{caminho|filtro}} pelos valores do contexto.
 * Ex.: "Plano {{plano.nome}}" / "{{calc.totalMensal|brl}}" / "{{dispositivos}} dispositivos"
 */
export function preencher(texto: string | undefined, ctx: Contexto): string {
  if (!texto) return "";
  return texto.replace(/\{\{\s*([\w.]+)\s*(?:\|\s*(\w+)\s*)?\}\}/g, (_, path: string, filtro?: string) => {
    const v = caminho(ctx, path);
    if (filtro && FILTROS[filtro]) return FILTROS[filtro](v);
    if (v === undefined || v === null) return "";
    return typeof v === "number" ? v.toLocaleString("pt-BR") : String(v);
  });
}

/** Avalia condições simples das seções: "campo", "!campo", "observacoes" (lista não vazia). */
export function condicao(expr: string | undefined, ctx: Contexto): boolean {
  if (!expr) return true;
  const neg = expr.startsWith("!");
  const v = caminho(ctx, neg ? expr.slice(1) : expr);
  const ok = Array.isArray(v) ? v.length > 0 : !!v;
  return neg ? !ok : ok;
}
