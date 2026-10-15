import "server-only";
import { db } from "./db";

/** Próximo número de controle da empresa no ano: CAD-2026-0001, CAD-2026-0002... */
export async function proximoCodigo(empresa: { id: string; prefixo: string }): Promise<string> {
  const ano = new Date().getFullYear();
  const c = await db.contadorProposta.upsert({
    where: { empresaId_ano: { empresaId: empresa.id, ano } },
    update: { ultimo: { increment: 1 } },
    create: { empresaId: empresa.id, ano, ultimo: 1 },
  });
  return `${empresa.prefixo}-${ano}-${String(c.ultimo).padStart(4, "0")}`;
}
