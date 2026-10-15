"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_EMPRESA, opcoesCookie } from "@/lib/sessao";
import { exigirSessao } from "@/lib/auth";

export async function trocarEmpresa(slug: string) {
  const { empresas } = await exigirSessao(undefined, "ver", { permitirTrocaSenha: true });
  if (!empresas.some((e) => e.slug === slug)) return;
  (await cookies()).set(COOKIE_EMPRESA, slug, opcoesCookie);
  revalidatePath("/admin", "layout");
}
