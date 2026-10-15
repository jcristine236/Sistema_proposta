// Registro de auditoria: quem fez o quê, quando e de onde.
import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { ipDeCabecalhos } from "./limite";

export async function ipAtual(): Promise<string | null> {
  try {
    return ipDeCabecalhos(await headers());
  } catch {
    return null;
  }
}

export async function auditar(dados: {
  usuarioId?: string | null;
  empresaId?: string | null;
  acao: string;
  entidade?: string;
  entidadeId?: string;
  descricao?: string;
}) {
  try {
    await db.logAuditoria.create({ data: { ...dados, descricao: dados.descricao?.slice(0, 500), ip: await ipAtual() } });
  } catch (e) {
    console.error("[auditoria] falha ao registrar", e);
  }
}
