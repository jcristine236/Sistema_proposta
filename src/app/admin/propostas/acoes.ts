"use server";

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { validar, type Campo, type Dados, type ValorContato } from "@/lib/campos";
import { calcular, type Precificacao } from "@/lib/precificacao";
import { slugify } from "@/lib/formato";
import { linkPublico } from "@/lib/links";

export async function criarProposta(modeloId: string, dados: Dados): Promise<{ id: string; link: string } | { erros: string[] }> {
  const { usuario, empresa } = await exigirSessao();
  const modelo = await db.modelo.findFirst({ where: { id: modeloId, empresaId: empresa.id, ativo: true } });
  if (!modelo) return { erros: ["Modelo não encontrado nesta empresa."] };

  const campos = modelo.campos as Campo[];
  const precificacao = modelo.precificacao as Precificacao;
  const erros = validar(campos, dados);
  if (erros.length) return { erros };

  // Cliente: usa o contato cadastrado ou cadastra um novo pelo nome
  const campoCliente = campos.find((c) => c.tipo === "contato");
  let contatoId: string | undefined;
  let clienteNome = "Cliente";
  if (campoCliente) {
    const v = dados[campoCliente.id] as ValorContato;
    clienteNome = v.nome.trim();
    const existente = v.contatoId
      ? await db.contato.findFirst({ where: { id: v.contatoId, empresaId: empresa.id } })
      : await db.contato.findFirst({ where: { empresaId: empresa.id, organizacao: { equals: clienteNome, mode: "insensitive" } } });
    contatoId = existente?.id ?? (await db.contato.create({ data: { empresaId: empresa.id, organizacao: clienteNome } })).id;
    dados = { ...dados, [campoCliente.id]: { nome: clienteNome, contatoId } };
  }

  const catalogo = await catalogoDaEmpresa(empresa.id);
  const calculo = calcular(precificacao, dados, catalogo);
  const campoData = campos.find((c) => c.tipo === "data");
  const validaAte = campoData && dados[campoData.id] ? new Date(`${dados[campoData.id]}T23:59:59-03:00`) : null;
  const slug = `${slugify(clienteNome)}-${randomBytes(4).toString("hex")}`;
  const json = (v: unknown) => v as Prisma.InputJsonValue;

  const proposta = await db.proposta.create({
    data: {
      empresaId: empresa.id,
      modeloId: modelo.id,
      autorId: usuario.id,
      contatoId,
      slug,
      titulo: `${modelo.nome} — ${clienteNome}`,
      clienteNome,
      dados: json(dados),
      // Congela o modelo e os preços do catálogo usados nesta proposta
      snapshot: json({ campos, secoes: modelo.secoes, precificacao, catalogo }),
      calculo: json(calculo),
      valorMensal: calculo.totalMensal,
      valorUnico: calculo.totalUnico,
      validaAte,
      descontoAcimaLimite: calculo.desconto.acimaLimite,
      eventos: { create: { tipo: "CRIADA", dados: json({ por: usuario.nome }) } },
    },
  });
  revalidatePath("/admin");
  return { id: proposta.id, link: linkPublico(empresa.dominioPropostas, slug) };
}
