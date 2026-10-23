import "server-only";
import { db } from "./db";

/** Número da primeira proposta de cada empresa/ano. Começamos em 1001 (e não
 *  em 0001) para dar um ar mais profissional à numeração. Vale para todas as
 *  empresas. */
export const PRIMEIRO_NUMERO = 1001;

/** Próximo número de controle da empresa no ano: CAD-2026-1001, CAD-2026-1002... */
export async function proximoCodigo(empresa: { id: string; prefixo: string }): Promise<string> {
  const ano = new Date().getFullYear();
  const c = await db.contadorProposta.upsert({
    where: { empresaId_ano: { empresaId: empresa.id, ano } },
    update: { ultimo: { increment: 1 } },
    create: { empresaId: empresa.id, ano, ultimo: PRIMEIRO_NUMERO },
  });
  return `${empresa.prefixo}-${ano}-${String(c.ultimo).padStart(4, "0")}`;
}
