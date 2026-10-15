"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auditar } from "@/lib/auditoria";
import { dentroDoLimite, ipDeCabecalhos } from "@/lib/limite";
import { COOKIE_EMPRESA, COOKIE_SESSAO, criarToken, lerToken, opcoesCookie } from "@/lib/sessao";

const MAX_FALHAS = 5;
const BLOQUEIO_MIN = 15;
// Hash de referência: compara mesmo quando o e-mail não existe (tempo de resposta igual)
const HASH_FALSO = bcrypt.hashSync("senha-inexistente-referencia", 12);

export async function entrar(_: { erro?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const senha = String(form.get("senha") ?? "").slice(0, 200);
  const voltar = String(form.get("voltar") ?? "/admin");
  const ip = ipDeCabecalhos(await headers());
  const bloqueio = { erro: "Muitas tentativas incorretas. Aguarde 15 minutos e tente novamente." };
  const generico = { erro: "E-mail ou senha incorretos." };

  if (!dentroDoLimite(`login-ip:${ip}`, 20, 15 * 60 * 1000)) return bloqueio;
  // Mesmo limite para e-mails inexistentes: não revela quais contas existem
  if (!dentroDoLimite(`login-email:${email}`, 8, 15 * 60 * 1000)) return bloqueio;

  const u = await db.usuario.findUnique({ where: { email } });
  if (u?.bloqueadoAte && u.bloqueadoAte > new Date()) {
    await bcrypt.compare(senha, HASH_FALSO);
    return bloqueio;
  }
  const ok = await bcrypt.compare(senha, u?.senhaHash ?? HASH_FALSO);
  if (!u || !ok || !u.ativo) {
    if (u) {
      const falhas = u.falhasLogin + 1;
      await db.usuario.update({
        where: { id: u.id },
        data: falhas >= MAX_FALHAS ? { falhasLogin: 0, bloqueadoAte: new Date(Date.now() + BLOQUEIO_MIN * 60000) } : { falhasLogin: falhas },
      });
      await auditar({ usuarioId: u.id, acao: falhas >= MAX_FALHAS ? "LOGIN_BLOQUEADO" : "LOGIN_FALHOU", descricao: email });
      if (falhas >= MAX_FALHAS) return bloqueio;
    } else {
      await auditar({ acao: "LOGIN_FALHOU", descricao: `e-mail inexistente: ${email}` });
    }
    return generico;
  }

  await db.usuario.update({ where: { id: u.id }, data: { falhasLogin: 0, bloqueadoAte: null, ultimoAcesso: new Date() } });
  await auditar({ usuarioId: u.id, acao: "LOGIN" });
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, await criarToken(u.id, u.versaoSessao), opcoesCookie);
  if (u.trocarSenha) redirect("/admin/conta?trocar=1");
  redirect(/^\/admin(\/[\w\-/?=&.]*)?$/.test(voltar) ? voltar : "/admin");
}

export async function sair() {
  const jar = await cookies();
  const t = await lerToken(jar.get(COOKIE_SESSAO)?.value);
  if (t) {
    // Sair encerra a sessão em todos os dispositivos (o token antigo deixa de valer)
    await db.usuario.update({ where: { id: t.uid }, data: { versaoSessao: { increment: 1 } } }).catch(() => {});
    await auditar({ usuarioId: t.uid, acao: "LOGOUT" });
  }
  jar.delete(COOKIE_SESSAO);
  jar.delete(COOKIE_EMPRESA);
  redirect("/login");
}
