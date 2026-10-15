// Usuário logado, empresa ativa e verificação de permissões (páginas e ações do painel).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { COOKIE_EMPRESA, COOKIE_SESSAO, lerToken } from "./sessao";
import { pode, type Acao, type Modulo } from "./permissoes";

export async function usuarioAtual() {
  const jar = await cookies();
  const t = await lerToken(jar.get(COOKIE_SESSAO)?.value);
  if (!t) return null;
  const u = await db.usuario.findUnique({
    where: { id: t.uid },
    include: { membros: { include: { empresa: true } } },
  });
  // Sessão inválida se o usuário foi desativado ou trocou a senha depois do login
  if (!u || !u.ativo || u.versaoSessao !== t.v) return null;
  return u;
}

export type Sessao = Awaited<ReturnType<typeof carregarSessao>>;

async function carregarSessao() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const empresas =
    usuario.superAdmin || usuario.todasEmpresas
      ? await db.empresa.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } })
      : usuario.membros.map((m) => m.empresa).filter((e) => e.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
  if (!empresas.length) redirect("/login?erro=sem-empresa");
  const slug = (await cookies()).get(COOKIE_EMPRESA)?.value;
  const empresa = empresas.find((e) => e.slug === slug) ?? empresas[0];
  const permite = (modulo: Modulo, acao: Acao = "ver") => pode(usuario, modulo, acao);
  return { usuario, empresa, empresas, permite };
}

/**
 * Exige login (e opcionalmente uma permissão) numa página do painel.
 * Sem permissão: redireciona para a tela de acesso negado.
 */
export async function exigirSessao(modulo?: Modulo, acao: Acao = "ver", opts?: { permitirTrocaSenha?: boolean }) {
  const s = await carregarSessao();
  if (s.usuario.trocarSenha && !opts?.permitirTrocaSenha) redirect("/admin/conta?trocar=1");
  if (modulo && !s.permite(modulo, acao)) redirect("/admin/sem-permissao");
  return s;
}

export class SemPermissao extends Error {
  constructor() {
    super("Você não tem permissão para esta ação.");
  }
}

/** Para server actions: lança erro em vez de redirecionar. */
export async function exigirAcao(modulo: Modulo, acao: Acao) {
  const usuario = await usuarioAtual();
  if (!usuario) throw new SemPermissao();
  const s = await carregarSessao();
  if (s.usuario.trocarSenha || !s.permite(modulo, acao)) throw new SemPermissao();
  return s;
}

/** Filtro de propostas: quem não tem "propostas de todos" só vê as próprias. */
export function filtroPropostas(s: Sessao) {
  const todas = s.usuario.superAdmin || (s.usuario.permissoes as { propostasDeTodos?: boolean })?.propostasDeTodos;
  return todas ? { empresaId: s.empresa.id } : { empresaId: s.empresa.id, autorId: s.usuario.id };
}
