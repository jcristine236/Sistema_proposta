"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigirAcao, SemPermissao, usuarioAtual } from "@/lib/auth";
import { auditar } from "@/lib/auditoria";
import { CORES_TEMA, temaDe, type Tema } from "@/lib/tema";
import { urlImagem } from "@/lib/urls";
import { cnpjValido, emailValido, formatarCnpj } from "@/lib/documentos";

type Estado = { ok?: string; erro?: string } | undefined;
const txt = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);

async function proteger(fn: () => Promise<Estado>): Promise<Estado> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SemPermissao) return { erro: e.message };
    throw e;
  }
}

// ---- Produtos ----------------------------------------------------------------

function lerAtributos(s: string) {
  const atributos: Record<string, number | string> = {};
  for (const par of s.split(/[;\n]/)) {
    const [k, v] = par.split("=").map((x) => x?.trim());
    if (k && v && /^[a-zA-Z]\w{0,30}$/.test(k)) atributos[k] = Number.isFinite(Number(v)) ? Number(v) : v.slice(0, 100);
  }
  return atributos;
}

export async function salvarProduto(_: Estado, f: FormData): Promise<Estado> {
  const id = txt(f, "id", 40);
  return proteger(async () => {
    const s = await exigirAcao("catalogo", id ? "editar" : "criar");
    const preco = Number(txt(f, "preco").replace(",", "."));
    if (!txt(f, "nome") || !txt(f, "categoria") || !Number.isFinite(preco) || preco < 0) return { erro: "Preencha nome, categoria e preço." };
    const codigo = txt(f, "codigo", 60) || null;
    if (codigo && !/^[\w-]+$/.test(codigo)) return { erro: "O código deve ter só letras, números, - ou _." };
    if (codigo && (await db.produto.findFirst({ where: { empresaId: s.empresa.id, codigo, NOT: id ? { id } : undefined } }))) return { erro: "Já existe um produto com este código." };
    const data = {
      nome: txt(f, "nome", 120), codigo, categoria: txt(f, "categoria", 60), descricao: txt(f, "descricao") || null, preco,
      recorrencia: txt(f, "recorrencia") === "UNICO" ? ("UNICO" as const) : ("MENSAL" as const),
      atributos: lerAtributos(txt(f, "atributos", 1000)) as Prisma.InputJsonValue,
      ordem: Math.round(Number(txt(f, "ordem")) || 0),
    };
    if (id) {
      const r = await db.produto.updateMany({ where: { id, empresaId: s.empresa.id }, data });
      if (!r.count) return { erro: "Produto não encontrado." };
    } else await db.produto.create({ data: { ...data, empresaId: s.empresa.id } });
    await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: id ? "EDITAR" : "CRIAR", entidade: "Produto", entidadeId: id || undefined, descricao: data.nome });
    revalidatePath("/admin/catalogo");
    if (id) redirect("/admin/catalogo");
    return { ok: "Produto cadastrado." };
  });
}

export async function alternarProduto(id: string) {
  const s = await exigirAcao("catalogo", "editar");
  const p = await db.produto.findFirst({ where: { id, empresaId: s.empresa.id } });
  if (p) await db.produto.update({ where: { id }, data: { ativo: !p.ativo } });
  revalidatePath("/admin/catalogo");
}

export async function excluirProduto(id: string) {
  const s = await exigirAcao("catalogo", "excluir");
  // Propostas guardam cópia do catálogo: excluir não afeta as já enviadas
  const r = await db.produto.deleteMany({ where: { id, empresaId: s.empresa.id } });
  if (r.count) await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EXCLUIR", entidade: "Produto", entidadeId: id });
  revalidatePath("/admin/catalogo");
}

// ---- Clientes ------------------------------------------------------------------

export async function salvarContato(_: Estado, f: FormData): Promise<Estado> {
  const id = txt(f, "id", 40);
  return proteger(async () => {
    const s = await exigirAcao("clientes", id ? "editar" : "criar");
    if (!txt(f, "organizacao")) return { erro: "Informe a empresa do cliente." };
    const email = txt(f, "email", 160);
    if (email && !emailValido(email)) return { erro: "E-mail inválido." };
    const cnpj = txt(f, "cnpj", 20);
    if (cnpj && !cnpjValido(cnpj)) return { erro: "CNPJ inválido." };
    const data = {
      organizacao: txt(f, "organizacao", 160), razaoSocial: txt(f, "razaoSocial", 200) || null, cnpj: cnpj ? formatarCnpj(cnpj) : null,
      responsavel: txt(f, "responsavel", 120) || null, email: email || null, celular: txt(f, "celular", 20) || null,
    };
    if (id) {
      const r = await db.contato.updateMany({ where: { id, empresaId: s.empresa.id }, data });
      if (!r.count) return { erro: "Cliente não encontrado." };
    } else await db.contato.create({ data: { ...data, empresaId: s.empresa.id } });
    await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: id ? "EDITAR" : "CRIAR", entidade: "Contato", entidadeId: id || undefined, descricao: data.organizacao });
    revalidatePath("/admin/contatos");
    if (id) redirect("/admin/contatos");
    return { ok: "Cliente cadastrado." };
  });
}

export async function excluirContato(id: string) {
  const s = await exigirAcao("clientes", "excluir");
  // As propostas mantêm o nome do cliente; só perdem o vínculo com o cadastro
  const r = await db.contato.deleteMany({ where: { id, empresaId: s.empresa.id } });
  if (r.count) await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EXCLUIR", entidade: "Contato", entidadeId: id });
  revalidatePath("/admin/contatos");
}

// ---- Empresa ativa (marca e avisos) --------------------------------------------

const Cor = /^#[0-9a-f]{6}$/i;

export async function salvarEmpresa(_: Estado, f: FormData): Promise<Estado> {
  return proteger(async () => {
    const s = await exigirAcao("empresa", "editar");
    const atual = temaDe(s.empresa.tema);
    const tema: Tema = { ...atual };
    for (const k of CORES_TEMA) {
      const v = txt(f, k, 7);
      if (Cor.test(v)) tema[k] = v;
    }
    for (const k of ["logo", "logoClaro"] as const) {
      const v = txt(f, k, 500);
      if (v && !urlImagem(v)) return { erro: "Endereço de logo inválido." };
      tema[k] = v;
    }
    const email = txt(f, "emailNotificacao", 160);
    if (email && !emailValido(email)) return { erro: "E-mail de avisos inválido." };
    const motivos = txt(f, "motivosRecusa", 3000).split("\n").map((m) => m.trim().slice(0, 100)).filter(Boolean).slice(0, 20);
    await db.empresa.update({
      where: { id: s.empresa.id },
      data: {
        razaoSocial: txt(f, "razaoSocial", 200) || null,
        site: txt(f, "site", 120) || null,
        rodape: txt(f, "rodape", 200) || null,
        emailNotificacao: email || null,
        whatsappNotificacao: txt(f, "whatsappNotificacao", 20).replace(/\D/g, "") || null,
        motivosRecusa: motivos as Prisma.InputJsonValue,
        tema: tema as Prisma.InputJsonValue,
      },
    });
    await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EDITAR", entidade: "Empresa", entidadeId: s.empresa.id, descricao: "marca e avisos" });
    revalidatePath("/admin", "layout");
    return { ok: "Alterações salvas." };
  });
}

// ---- Empresas da plataforma (somente superadmin) -------------------------------

const EmpresaZ = z.object({
  id: z.string().max(40).optional(),
  nome: z.string().trim().min(1, "Informe o nome").max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,30}$/, "Identificador: letras minúsculas, números e -"),
  prefixo: z.string().trim().regex(/^[A-Z]{2,5}$/, "Prefixo: 2 a 5 letras maiúsculas (ex.: CAD)"),
  dominioPropostas: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Domínio inválido (ex.: propostas.empresa.com.br)"),
  razaoSocial: z.string().trim().max(200).optional(),
  site: z.string().trim().max(120).optional(),
});

export async function salvarEmpresaPlataforma(_: Estado, f: FormData): Promise<Estado> {
  const u = await usuarioAtual();
  if (!u?.superAdmin) return { erro: "Apenas superadministradores gerenciam empresas." };
  const r = EmpresaZ.safeParse(Object.fromEntries(["id", "nome", "slug", "prefixo", "dominioPropostas", "razaoSocial", "site"].map((k) => [k, txt(f, k) || undefined])));
  if (!r.success) return { erro: r.error.issues[0].message };
  const d = r.data;
  const conflito = await db.empresa.findFirst({ where: { OR: [{ slug: d.slug }, { prefixo: d.prefixo }, { dominioPropostas: d.dominioPropostas }], NOT: d.id ? { id: d.id } : undefined } });
  if (conflito) return { erro: "Identificador, prefixo ou domínio já usado por outra empresa." };
  const dados = { nome: d.nome, slug: d.slug, prefixo: d.prefixo, dominioPropostas: d.dominioPropostas, razaoSocial: d.razaoSocial ?? null, site: d.site ?? null };
  if (d.id) await db.empresa.update({ where: { id: d.id }, data: dados });
  else {
    const e = await db.empresa.create({ data: { ...dados, tema: temaDe({}) as Prisma.InputJsonValue, motivosRecusa: ["Preço acima do esperado", "Escolhi outro fornecedor", "Projeto adiado", "Outro motivo"] } });
    d.id = e.id;
  }
  await auditar({ usuarioId: u.id, empresaId: d.id, acao: r.data.id ? "EDITAR" : "CRIAR", entidade: "Empresa", entidadeId: d.id, descricao: d.nome });
  revalidatePath("/admin", "layout");
  return { ok: "Empresa salva." };
}

export async function alternarEmpresa(id: string) {
  const u = await usuarioAtual();
  if (!u?.superAdmin) return;
  const e = await db.empresa.findUnique({ where: { id } });
  if (!e) return;
  await db.empresa.update({ where: { id }, data: { ativo: !e.ativo } });
  await auditar({ usuarioId: u.id, empresaId: id, acao: e.ativo ? "DESATIVAR" : "ATIVAR", entidade: "Empresa", entidadeId: id, descricao: e.nome });
  revalidatePath("/admin", "layout");
}
