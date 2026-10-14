import "server-only";
import { db } from "./db";
import type { ProdutoCatalogo } from "./precificacao";

/** Produtos ativos da empresa, já no formato usado pelo cálculo (preço em número). */
export async function catalogoDaEmpresa(empresaId: string): Promise<ProdutoCatalogo[]> {
  const itens = await db.produto.findMany({ where: { empresaId, ativo: true }, orderBy: [{ categoria: "asc" }, { ordem: "asc" }] });
  return itens.map((p) => ({
    id: p.id,
    categoria: p.categoria,
    codigo: p.codigo ?? p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco: Number(p.preco),
    atributos: (p.atributos ?? {}) as Record<string, number | string>,
  }));
}
