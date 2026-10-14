"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";

export async function duplicarModelo(id: string) {
  const { empresa } = await exigirSessao();
  const m = await db.modelo.findFirst({ where: { id, empresaId: empresa.id } });
  if (!m) return;
  const novo = await db.modelo.create({
    data: {
      empresaId: empresa.id,
      nome: `${m.nome} (cópia)`,
      descricao: m.descricao,
      tipoSolucao: m.tipoSolucao,
      validadeDias: m.validadeDias,
      campos: m.campos as Prisma.InputJsonValue,
      secoes: m.secoes as Prisma.InputJsonValue,
      precificacao: m.precificacao as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/admin/modelos");
  redirect(`/admin/modelos/${novo.id}`);
}

export async function alternarModelo(id: string) {
  const { empresa } = await exigirSessao();
  const m = await db.modelo.findFirst({ where: { id, empresaId: empresa.id } });
  if (!m) return;
  await db.modelo.update({ where: { id }, data: { ativo: !m.ativo } });
  revalidatePath("/admin/modelos");
}
