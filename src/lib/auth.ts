// Usuário logado e empresa ativa (para páginas e ações do painel).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { COOKIE_EMPRESA, COOKIE_SESSAO, lerToken } from "./sessao";

export async function usuarioAtual() {
  const jar = await cookies();
  const uid = await lerToken(jar.get(COOKIE_SESSAO)?.value);
  if (!uid) return null;
  return db.usuario.findFirst({
    where: { id: uid, ativo: true },
    include: { membros: { include: { empresa: true }, orderBy: { empresa: { nome: "asc" } } } },
  });
}

/** Exige login e devolve usuário + empresa ativa (cookie, ou a primeira disponível). */
export async function exigirSessao() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const jar = await cookies();
  const slug = jar.get(COOKIE_EMPRESA)?.value;

  // Superadmin enxerga todas as empresas; demais, só as que é membro.
  const empresas = usuario.superAdmin
    ? await db.empresa.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } })
    : usuario.membros.map((m) => m.empresa).filter((e) => e.ativo);
  if (!empresas.length) redirect("/login?erro=sem-empresa");
  const empresa = empresas.find((e) => e.slug === slug) ?? empresas[0];
  const papel = usuario.superAdmin ? "ADMIN" : usuario.membros.find((m) => m.empresaId === empresa.id)?.papel ?? "VENDEDOR";
  return { usuario, empresa, empresas, papel };
}
