"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { TEMA_PADRAO, temaDe, type Tema } from "@/lib/tema";

type Estado = { ok?: string; erro?: string } | undefined;
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function salvarProduto(_: Estado, f: FormData): Promise<Estado> {
  const { empresa } = await exigirSessao();
  const preco = Number(txt(f, "preco").replace(",", "."));
  if (!txt(f, "nome") || !txt(f, "categoria") || !Number.isFinite(preco)) return { erro: "Preencha nome, categoria e preço." };
  let atributos: Record<string, number | string> = {};
  for (const par of txt(f, "atributos").split(/[;\n]/)) {
    const [k, v] = par.split("=").map((x) => x?.trim());
    if (k && v) atributos[k] = Number.isFinite(Number(v)) ? Number(v) : v;
  }
  await db.produto.create({
    data: {
      empresaId: empresa.id,
      nome: txt(f, "nome"),
      codigo: txt(f, "codigo") || null,
      categoria: txt(f, "categoria"),
      descricao: txt(f, "descricao") || null,
      preco,
      recorrencia: txt(f, "recorrencia") === "UNICO" ? "UNICO" : "MENSAL",
      atributos: atributos as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/admin/catalogo");
  return { ok: "Produto cadastrado." };
}

export async function alternarProduto(id: string) {
  const { empresa } = await exigirSessao();
  const p = await db.produto.findFirst({ where: { id, empresaId: empresa.id } });
  if (p) await db.produto.update({ where: { id }, data: { ativo: !p.ativo } });
  revalidatePath("/admin/catalogo");
}

export async function salvarContato(_: Estado, f: FormData): Promise<Estado> {
  const { empresa } = await exigirSessao();
  if (!txt(f, "organizacao")) return { erro: "Informe a empresa do cliente." };
  await db.contato.create({
    data: {
      empresaId: empresa.id,
      organizacao: txt(f, "organizacao"),
      responsavel: txt(f, "responsavel") || null,
      email: txt(f, "email") || null,
      celular: txt(f, "celular") || null,
    },
  });
  revalidatePath("/admin/contatos");
  return { ok: "Cliente cadastrado." };
}

const Dominio = z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Domínio inválido (ex.: propostas.caddi.com.br)");
const Cor = z.string().regex(/^#[0-9a-f]{6}$/i);

export async function salvarEmpresa(_: Estado, f: FormData): Promise<Estado> {
  const { empresa, papel } = await exigirSessao();
  if (papel !== "ADMIN") return { erro: "Apenas administradores podem alterar a empresa." };
  const dominio = Dominio.safeParse(txt(f, "dominioPropostas").toLowerCase());
  if (!dominio.success) return { erro: dominio.error.issues[0].message };
  const atual = temaDe(empresa.tema);
  const tema: Tema = { ...atual };
  for (const k of ["primaria", "primaria2", "destaque", "destaqueSuave", "destaqueTexto", "neutra", "tinta"] as const) {
    const v = Cor.safeParse(txt(f, k));
    tema[k] = v.success ? v.data : TEMA_PADRAO[k];
  }
  for (const k of ["fonteTitulo", "fonteTexto", "fonteNumeros", "logo", "logoClaro"] as const) tema[k] = txt(f, k) || (k === "logoClaro" ? "" : TEMA_PADRAO[k]);
  try {
    await db.empresa.update({
      where: { id: empresa.id },
      data: {
        nome: txt(f, "nome") || empresa.nome,
        razaoSocial: txt(f, "razaoSocial") || null,
        site: txt(f, "site") || null,
        dominioPropostas: dominio.data,
        rodape: txt(f, "rodape") || null,
        emailNotificacao: txt(f, "emailNotificacao") || null,
        tema: tema as Prisma.InputJsonValue,
      },
    });
  } catch {
    return { erro: "Este domínio já está em uso por outra empresa." };
  }
  revalidatePath("/admin", "layout");
  return { ok: "Alterações salvas." };
}
