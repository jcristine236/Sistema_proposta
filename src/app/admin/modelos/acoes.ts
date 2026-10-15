"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAcao, SemPermissao } from "@/lib/auth";
import { auditar } from "@/lib/auditoria";
import { tamanhoOk, validarCampos, validarPrecificacao, validarSecao, validarSecoes } from "@/lib/validacao";
import type { DadosModelo } from "@/components/editor/EditorModelo";
import type { Secao } from "@/lib/secoes";
import { BLOCO, novoId } from "@/lib/blocos";

const json = (v: unknown) => v as Prisma.InputJsonValue;
type Resultado = { id: string } | { erro: string };

async function tentar<T>(fn: () => Promise<T>): Promise<T | { erro: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SemPermissao) return { erro: e.message };
    throw e;
  }
}

export async function salvarModeloEditor(m: DadosModelo): Promise<Resultado> {
  return tentar(async () => {
    const s = await exigirAcao("modelos", m.id ? "editar" : "criar");
    const nome = String(m.nome ?? "").trim().slice(0, 120);
    if (!nome) return { erro: "Dê um nome ao modelo." };
    const campos = validarCampos(m.campos);
    if ("erro" in campos) return campos;
    const secoes = validarSecoes(m.secoes);
    if ("erro" in secoes) return secoes;
    const prec = validarPrecificacao(m.precificacao, campos.ok);
    if ("erro" in prec) return prec;
    if (!tamanhoOk(campos.ok, secoes.ok, prec.ok)) return { erro: "Modelo grande demais." };
    const data = {
      nome,
      descricao: String(m.descricao ?? "").slice(0, 300) || null,
      tipoSolucao: String(m.tipoSolucao ?? "personalizado").slice(0, 60) || "personalizado",
      validadeDias: Math.min(365, Math.max(1, Math.round(Number(m.validadeDias) || 15))),
      campos: json(campos.ok),
      secoes: json(secoes.ok),
      precificacao: json(prec.ok),
    };
    let id = m.id;
    if (id) {
      const existe = await db.modelo.findFirst({ where: { id, empresaId: s.empresa.id } });
      if (!existe) return { erro: "Modelo não encontrado." };
      await db.modelo.update({ where: { id }, data });
    } else {
      id = (await db.modelo.create({ data: { ...data, empresaId: s.empresa.id } })).id;
    }
    await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: m.id ? "EDITAR" : "CRIAR", entidade: "Modelo", entidadeId: id, descricao: nome });
    revalidatePath("/admin/modelos");
    return { id };
  });
}

export async function criarModeloEmBranco() {
  const s = await exigirAcao("modelos", "criar");
  const capa = { ...BLOCO.capa.padrao(), id: novoId("capa") };
  const fech = { ...BLOCO.fechamento.padrao(), id: novoId("fechamento") };
  const m = await db.modelo.create({
    data: {
      empresaId: s.empresa.id,
      nome: "Novo modelo",
      tipoSolucao: "personalizado",
      campos: json([
        { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
        { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
      ]),
      secoes: json([capa, fech]),
      precificacao: json({}),
    },
  });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "CRIAR", entidade: "Modelo", entidadeId: m.id, descricao: "Novo modelo" });
  redirect(`/admin/modelos/${m.id}/editar`);
}

export async function duplicarModelo(id: string) {
  const s = await exigirAcao("modelos", "criar");
  const m = await db.modelo.findFirst({ where: { id, empresaId: s.empresa.id } });
  if (!m) return;
  const novo = await db.modelo.create({
    data: {
      empresaId: s.empresa.id, nome: `${m.nome} (cópia)`, descricao: m.descricao, tipoSolucao: m.tipoSolucao, validadeDias: m.validadeDias,
      campos: m.campos as Prisma.InputJsonValue, secoes: m.secoes as Prisma.InputJsonValue, precificacao: m.precificacao as Prisma.InputJsonValue,
    },
  });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "CRIAR", entidade: "Modelo", entidadeId: novo.id, descricao: `Cópia de ${m.nome}` });
  revalidatePath("/admin/modelos");
  redirect(`/admin/modelos/${novo.id}/editar`);
}

export async function alternarModelo(id: string) {
  const s = await exigirAcao("modelos", "editar");
  const m = await db.modelo.findFirst({ where: { id, empresaId: s.empresa.id } });
  if (!m) return;
  await db.modelo.update({ where: { id }, data: { ativo: !m.ativo } });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: m.ativo ? "DESATIVAR" : "ATIVAR", entidade: "Modelo", entidadeId: id, descricao: m.nome });
  revalidatePath("/admin/modelos");
}

export async function excluirModelo(id: string) {
  const s = await exigirAcao("modelos", "excluir");
  const m = await db.modelo.findFirst({ where: { id, empresaId: s.empresa.id } });
  if (!m) return;
  // Propostas já enviadas continuam funcionando: guardam cópia do modelo (snapshot)
  await db.modelo.delete({ where: { id } });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EXCLUIR", entidade: "Modelo", entidadeId: id, descricao: m.nome });
  revalidatePath("/admin/modelos");
  redirect("/admin/modelos");
}

// ---- Seções modelo (favoritas) --------------------------------------------

export async function salvarSecaoFavorita(d: { id?: string; nome: string; secao: Secao }): Promise<Resultado> {
  return tentar(async () => {
    const s = await exigirAcao("modelos", d.id ? "editar" : "criar");
    const nome = String(d.nome ?? "").trim().slice(0, 120);
    if (!nome) return { erro: "Dê um nome à seção." };
    const v = validarSecao(d.secao);
    if ("erro" in v) return v;
    if (!tamanhoOk(v.ok)) return { erro: "Seção grande demais." };
    let id = d.id;
    if (id) {
      const existe = await db.secaoModelo.findFirst({ where: { id, empresaId: s.empresa.id } });
      if (!existe) return { erro: "Seção não encontrada." };
      await db.secaoModelo.update({ where: { id }, data: { nome, secao: json(v.ok) } });
    } else {
      id = (await db.secaoModelo.create({ data: { empresaId: s.empresa.id, nome, secao: json(v.ok) } })).id;
    }
    await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: d.id ? "EDITAR" : "CRIAR", entidade: "SecaoModelo", entidadeId: id, descricao: nome });
    revalidatePath("/admin/modelos");
    return { id };
  });
}

export async function criarSecaoModelo(tipo: string) {
  const s = await exigirAcao("modelos", "criar");
  const def = BLOCO[tipo] ?? BLOCO.texto;
  const r = await db.secaoModelo.create({
    data: { empresaId: s.empresa.id, nome: def.nome, secao: json({ ...def.padrao(), id: novoId(def.tipo) }) },
  });
  redirect(`/admin/modelos/secoes/${r.id}`);
}

export async function renomearSecaoModelo(id: string, form: FormData) {
  const s = await exigirAcao("modelos", "editar");
  const nome = String(form.get("nome") ?? "").trim().slice(0, 120);
  if (!nome) return;
  await db.secaoModelo.updateMany({ where: { id, empresaId: s.empresa.id }, data: { nome } });
  revalidatePath("/admin/modelos");
}

export async function excluirSecaoModelo(id: string) {
  const s = await exigirAcao("modelos", "excluir");
  const r = await db.secaoModelo.deleteMany({ where: { id, empresaId: s.empresa.id } });
  if (r.count) await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EXCLUIR", entidade: "SecaoModelo", entidadeId: id });
  revalidatePath("/admin/modelos");
}
