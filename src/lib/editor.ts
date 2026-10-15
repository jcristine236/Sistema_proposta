import "server-only";
import { db } from "./db";
import type { Secao } from "./secoes";

export async function favoritasDaEmpresa(empresaId: string) {
  const l = await db.secaoModelo.findMany({ where: { empresaId }, orderBy: { nome: "asc" } });
  return l.map((f) => ({ id: f.id, nome: f.nome, secao: f.secao as unknown as Secao }));
}
