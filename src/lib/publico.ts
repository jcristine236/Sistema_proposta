// Carrega uma proposta pelo link público, respeitando o domínio da empresa.
import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

export async function hostAtual() {
  const h = await headers();
  return (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
}

/** Em produção, a proposta só abre no domínio de propostas da própria empresa. */
export function hostPermitido(host: string, dominioEmpresa: string) {
  if (process.env.ALLOW_ANY_HOST === "true") return true;
  return host === dominioEmpresa.toLowerCase();
}

export async function propostaPublica(slug: string) {
  const p = await db.proposta.findUnique({ where: { slug }, include: { empresa: true, autor: { select: { nome: true, email: true } } } });
  if (!p || p.status === "RASCUNHO" || !p.empresa.ativo) return null;
  if (!hostPermitido(await hostAtual(), p.empresa.dominioPropostas)) return null;

  // Expiração "preguiçosa": marca como expirada no primeiro acesso após a validade
  if (p.validaAte && p.validaAte < new Date() && (p.status === "PUBLICADA" || p.status === "ABERTA")) {
    await db.proposta.update({ where: { id: p.id }, data: { status: "EXPIRADA" } });
    p.status = "EXPIRADA";
  }
  return p;
}
