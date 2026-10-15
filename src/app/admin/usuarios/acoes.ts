"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigirAcao, SemPermissao } from "@/lib/auth";
import { auditar } from "@/lib/auditoria";
import { lerPermissoes, MODULOS, sanitizarPermissoes, type Acao, type Modulo, type Permissoes } from "@/lib/permissoes";
import { CUSTO_BCRYPT, problemaSenha } from "@/lib/senha";
import { emailValido } from "@/lib/documentos";

export type DadosUsuario = {
  id?: string;
  nome: string;
  email: string;
  whatsapp: string;
  ativo: boolean;
  superAdmin: boolean;
  todasEmpresas: boolean;
  empresas: string[]; // ids
  permissoes: Permissoes;
  senha?: string; // nova senha (opcional na edição)
};

type Retorno = { ok: true; id: string; senhaTemporaria?: string } | { erro: string };

/** Quem não é superadmin não pode conceder o que não tem. */
function limitarAoConcedente(p: Permissoes, concedente: { superAdmin: boolean; permissoes: unknown }): Permissoes {
  if (concedente.superAdmin) return p;
  const meu = lerPermissoes(concedente.permissoes);
  const modulos: Permissoes["modulos"] = {};
  for (const m of Object.keys(MODULOS) as Modulo[]) {
    const acoes = Object.fromEntries(Object.entries(p.modulos[m] ?? {}).filter(([a, v]) => v && meu.modulos[m]?.[a as Acao]));
    if (Object.keys(acoes).length) modulos[m] = acoes;
  }
  return { modulos, propostasDeTodos: !!p.propostasDeTodos && !!meu.propostasDeTodos };
}

export async function salvarUsuario(d: DadosUsuario): Promise<Retorno> {
  let s;
  try { s = await exigirAcao("usuarios", d.id ? "editar" : "criar"); } catch (e) { if (e instanceof SemPermissao) return { erro: e.message }; throw e; }
  const eu = s.usuario;
  const nome = String(d.nome ?? "").trim().slice(0, 120);
  const email = String(d.email ?? "").trim().toLowerCase();
  if (!nome) return { erro: "Informe o nome." };
  if (!emailValido(email)) return { erro: "E-mail inválido." };

  const alvo = d.id ? await db.usuario.findUnique({ where: { id: d.id }, include: { membros: true } }) : null;
  if (d.id && !alvo) return { erro: "Usuário não encontrado." };
  if (alvo?.superAdmin && !eu.superAdmin) return { erro: "Apenas um superadministrador pode alterar outro superadministrador." };
  if (alvo && alvo.id === eu.id && (!d.ativo || (eu.superAdmin && !d.superAdmin))) return { erro: "Você não pode desativar nem rebaixar o próprio acesso." };
  if (await db.usuario.findFirst({ where: { email, NOT: d.id ? { id: d.id } : undefined } })) return { erro: "Já existe um usuário com este e-mail." };

  // Empresas que quem está editando pode conceder
  const minhas = new Set(s.empresas.map((e) => e.id));
  const empresas = (d.empresas ?? []).filter((id) => eu.superAdmin || minhas.has(id));
  // Se não sou super, preservo vínculos do alvo com empresas que eu não enxergo
  const preservar = alvo && !eu.superAdmin ? alvo.membros.map((m) => m.empresaId).filter((id) => !minhas.has(id)) : [];
  const superAdmin = eu.superAdmin ? !!d.superAdmin : !!alvo?.superAdmin;
  const todasEmpresas = eu.superAdmin || eu.todasEmpresas ? !!d.todasEmpresas : !!alvo?.todasEmpresas;
  if (!superAdmin && !todasEmpresas && empresas.length + preservar.length === 0) return { erro: "Escolha pelo menos uma empresa." };
  const permissoes = limitarAoConcedente(sanitizarPermissoes(d.permissoes ?? { modulos: {} }), eu);

  let senhaTemporaria: string | undefined;
  let senhaHash: string | undefined;
  if (d.senha) {
    const prob = problemaSenha(d.senha);
    if (prob) return { erro: prob };
    senhaHash = await bcrypt.hash(d.senha, CUSTO_BCRYPT);
  } else if (!alvo) {
    senhaTemporaria = `${randomBytes(6).toString("base64url")}9a`;
    senhaHash = await bcrypt.hash(senhaTemporaria, CUSTO_BCRYPT);
  }

  const dados = {
    nome, email, whatsapp: String(d.whatsapp ?? "").replace(/[^\d+]/g, "").slice(0, 16) || null,
    ativo: !!d.ativo, superAdmin, todasEmpresas, permissoes: permissoes as unknown as Prisma.InputJsonValue,
    ...(senhaHash ? { senhaHash, trocarSenha: true } : {}),
  };
  const mudouAcesso = alvo && (alvo.ativo !== dados.ativo || !!senhaHash || JSON.stringify(alvo.permissoes) !== JSON.stringify(dados.permissoes));
  const u = alvo
    ? await db.usuario.update({ where: { id: alvo.id }, data: { ...dados, ...(mudouAcesso ? { versaoSessao: { increment: 1 } } : {}) } })
    : await db.usuario.create({ data: { ...dados, senhaHash: senhaHash! } });

  await db.membro.deleteMany({ where: { usuarioId: u.id } });
  const vinculos = [...new Set([...empresas, ...preservar])];
  if (vinculos.length) await db.membro.createMany({ data: vinculos.map((empresaId) => ({ usuarioId: u.id, empresaId })) });

  await auditar({ usuarioId: eu.id, empresaId: s.empresa.id, acao: alvo ? "EDITAR" : "CRIAR", entidade: "Usuario", entidadeId: u.id, descricao: `${email}${senhaHash ? " (senha definida)" : ""}` });
  revalidatePath("/admin/usuarios");
  return { ok: true, id: u.id, senhaTemporaria };
}

export async function redefinirSenha(id: string): Promise<{ senha: string } | { erro: string }> {
  let s;
  try { s = await exigirAcao("usuarios", "editar"); } catch (e) { if (e instanceof SemPermissao) return { erro: e.message }; throw e; }
  const alvo = await db.usuario.findUnique({ where: { id } });
  if (!alvo) return { erro: "Usuário não encontrado." };
  if (alvo.superAdmin && !s.usuario.superAdmin) return { erro: "Sem permissão para este usuário." };
  const senha = `${randomBytes(6).toString("base64url")}7b`;
  await db.usuario.update({ where: { id }, data: { senhaHash: await bcrypt.hash(senha, CUSTO_BCRYPT), trocarSenha: true, versaoSessao: { increment: 1 }, falhasLogin: 0, bloqueadoAte: null } });
  await auditar({ usuarioId: s.usuario.id, acao: "REDEFINIR_SENHA", entidade: "Usuario", entidadeId: id, descricao: alvo.email });
  return { senha };
}

export async function excluirUsuario(id: string) {
  const s = await exigirAcao("usuarios", "excluir");
  const alvo = await db.usuario.findUnique({ where: { id }, include: { _count: { select: { propostas: true } } } });
  if (!alvo || alvo.id === s.usuario.id) return;
  if (alvo.superAdmin && !s.usuario.superAdmin) return;
  if (alvo._count.propostas > 0) {
    // Mantém o histórico das propostas: apenas desativa e encerra as sessões
    await db.usuario.update({ where: { id }, data: { ativo: false, versaoSessao: { increment: 1 } } });
    await auditar({ usuarioId: s.usuario.id, acao: "DESATIVAR", entidade: "Usuario", entidadeId: id, descricao: `${alvo.email} (tem propostas)` });
  } else {
    await db.usuario.delete({ where: { id } });
    await auditar({ usuarioId: s.usuario.id, acao: "EXCLUIR", entidade: "Usuario", entidadeId: id, descricao: alvo.email });
  }
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

// ---- Minha conta --------------------------------------------------------------

const Conta = z.object({ nome: z.string().trim().min(1).max(120), whatsapp: z.string().max(20), senhaAtual: z.string().max(200), novaSenha: z.string().max(200), confirmar: z.string().max(200) });

export async function salvarConta(_: unknown, form: FormData): Promise<{ ok?: string; erro?: string }> {
  const { usuarioAtual } = await import("@/lib/auth");
  const { cookies } = await import("next/headers");
  const { criarToken, COOKIE_SESSAO, opcoesCookie } = await import("@/lib/sessao");
  const u = await usuarioAtual();
  if (!u) return { erro: "Sessão expirada." };
  const r = Conta.safeParse(Object.fromEntries(["nome", "whatsapp", "senhaAtual", "novaSenha", "confirmar"].map((k) => [k, String(form.get(k) ?? "")])));
  if (!r.success) return { erro: "Dados inválidos." };
  const d = r.data;
  const data: Prisma.UsuarioUpdateInput = { nome: d.nome, whatsapp: d.whatsapp.replace(/[^\d+]/g, "") || null };
  let novaVersao: number | null = null;
  if (d.novaSenha || u.trocarSenha) {
    if (!(await bcrypt.compare(d.senhaAtual, u.senhaHash))) return { erro: "Senha atual incorreta." };
    if (d.novaSenha !== d.confirmar) return { erro: "A confirmação não confere com a nova senha." };
    const prob = problemaSenha(d.novaSenha);
    if (prob) return { erro: prob };
    if (await bcrypt.compare(d.novaSenha, u.senhaHash)) return { erro: "A nova senha precisa ser diferente da atual." };
    data.senhaHash = await bcrypt.hash(d.novaSenha, CUSTO_BCRYPT);
    data.trocarSenha = false;
    data.versaoSessao = { increment: 1 };
    novaVersao = u.versaoSessao + 1;
  }
  await db.usuario.update({ where: { id: u.id }, data });
  if (novaVersao !== null) {
    // Encerra outras sessões e renova a atual
    (await cookies()).set(COOKIE_SESSAO, await criarToken(u.id, novaVersao), opcoesCookie);
    await auditar({ usuarioId: u.id, acao: "TROCAR_SENHA" });
  }
  revalidatePath("/admin", "layout");
  return { ok: novaVersao !== null ? "Dados e senha atualizados." : "Dados atualizados." };
}
