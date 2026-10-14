"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { COOKIE_EMPRESA, COOKIE_SESSAO, criarToken, opcoesCookie } from "@/lib/sessao";

export async function entrar(_: { erro?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const voltar = String(form.get("voltar") ?? "/admin");
  const usuario = await db.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    return { erro: "E-mail ou senha incorretos." };
  }
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, await criarToken(usuario.id), opcoesCookie);
  redirect(voltar.startsWith("/admin") ? voltar : "/admin");
}

export async function sair() {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
  jar.delete(COOKIE_EMPRESA);
  redirect("/login");
}
