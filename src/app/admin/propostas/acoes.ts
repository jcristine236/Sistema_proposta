"use server";

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAcao, filtroPropostas, SemPermissao } from "@/lib/auth";
import { auditar } from "@/lib/auditoria";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { validar, type Campo, type Dados, type ValorContato } from "@/lib/campos";
import { calcular, catalogoDoModelo, type Precificacao } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { slugify } from "@/lib/formato";
import { linkPublico } from "@/lib/links";
import { proximoCodigo } from "@/lib/numeracao";
import { gerarContrato, d4signPronto, type ContratoProposta, type D4SignConfig } from "@/lib/d4sign";

const json = (v: unknown) => v as Prisma.InputJsonValue;
type Retorno = { id: string; link: string; codigo: string } | { erros: string[] };

/** Limita tamanho/forma dos dados preenchidos (vindos do navegador). */
function dadosSeguros(campos: Campo[], dados: Dados): Dados {
  const out: Dados = {};
  for (const c of campos) {
    const v = dados[c.id];
    if (v === undefined) continue;
    const txt = JSON.stringify(v);
    if (txt.length > 20000) continue;
    out[c.id] = JSON.parse(txt);
  }
  return out;
}

async function resolverContato(empresaId: string, campos: Campo[], dados: Dados) {
  const campoCliente = campos.find((c) => c.tipo === "contato");
  if (!campoCliente) return { dados, clienteNome: "Cliente", contatoId: undefined as string | undefined };
  const v = (dados[campoCliente.id] ?? { nome: "" }) as ValorContato;
  const clienteNome = String(v.nome ?? "").trim().slice(0, 160) || "Cliente";
  const existente = v.contatoId
    ? await db.contato.findFirst({ where: { id: v.contatoId, empresaId } })
    : await db.contato.findFirst({ where: { empresaId, organizacao: { equals: clienteNome, mode: "insensitive" } } });
  const contatoId = existente?.id ?? (await db.contato.create({ data: { empresaId, organizacao: clienteNome } })).id;
  return { dados: { ...dados, [campoCliente.id]: { nome: clienteNome, contatoId } }, clienteNome, contatoId };
}

function validade(campos: Campo[], dados: Dados) {
  const c = campos.find((x) => x.tipo === "data");
  const v = c ? String(dados[c.id] ?? "") : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T23:59:59-03:00`) : null;
}

export async function criarProposta(modeloId: string, dadosBrutos: Dados): Promise<Retorno> {
  let s;
  try { s = await exigirAcao("propostas", "criar"); } catch (e) { if (e instanceof SemPermissao) return { erros: [e.message] }; throw e; }
  const modelo = await db.modelo.findFirst({ where: { id: modeloId, empresaId: s.empresa.id, ativo: true } });
  if (!modelo) return { erros: ["Modelo não encontrado nesta empresa."] };

  const campos = modelo.campos as Campo[];
  const precificacao = modelo.precificacao as Precificacao;
  const erros = validar(campos, dadosBrutos);
  if (erros.length) return { erros };

  const r = await resolverContato(s.empresa.id, campos, dadosSeguros(campos, dadosBrutos));
  const catalogo = catalogoDoModelo(campos, await catalogoDaEmpresa(s.empresa.id));
  const calculo = calcular(precificacao, r.dados, catalogo);
  const slug = `${slugify(r.clienteNome)}-${randomBytes(6).toString("hex")}`;
  const codigo = await proximoCodigo(s.empresa);

  const p = await db.proposta.create({
    data: {
      empresaId: s.empresa.id,
      codigo,
      modeloId: modelo.id,
      autorId: s.usuario.id,
      contatoId: r.contatoId,
      slug,
      titulo: `${modelo.nome} — ${r.clienteNome}`,
      clienteNome: r.clienteNome,
      dados: json(r.dados),
      // Congela o modelo e os preços do catálogo usados nesta proposta
      snapshot: json({ campos, secoes: modelo.secoes, precificacao, catalogo, modeloNome: modelo.nome }),
      calculo: json(calculo),
      valorMensal: calculo.totalMensal,
      valorUnico: calculo.totalUnico,
      validaAte: validade(campos, r.dados),
      descontoAcimaLimite: calculo.desconto.acimaLimite,
      eventos: { create: { tipo: "CRIADA", dados: json({ nome: s.usuario.nome }) } },
    },
  });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "CRIAR", entidade: "Proposta", entidadeId: p.id, descricao: `${codigo} ${r.clienteNome}` });
  revalidatePath("/admin");
  return { id: p.id, link: linkPublico(s.empresa.dominioPropostas, slug), codigo };
}

/** Edita os dados de uma proposta já enviada (o link continua o mesmo). */
export async function editarProposta(id: string, dadosBrutos: Dados): Promise<Retorno> {
  let s;
  try { s = await exigirAcao("propostas", "editar"); } catch (e) { if (e instanceof SemPermissao) return { erros: [e.message] }; throw e; }
  const p = await db.proposta.findFirst({ where: { id, ...filtroPropostas(s) } });
  if (!p) return { erros: ["Proposta não encontrada."] };
  if (p.status === "ACEITA") return { erros: ["Proposta já aceita: não pode ser alterada. Duplique para criar uma nova versão."] };

  const snap = p.snapshot as { campos: Campo[]; secoes: Secao[]; precificacao: Precificacao };
  const erros = validar(snap.campos, dadosBrutos);
  if (erros.length) return { erros };
  const r = await resolverContato(s.empresa.id, snap.campos, dadosSeguros(snap.campos, dadosBrutos));
  const catalogo = catalogoDoModelo(snap.campos, await catalogoDaEmpresa(s.empresa.id));
  const calculo = calcular(snap.precificacao, r.dados, catalogo);
  const validaAte = validade(snap.campos, r.dados);
  // Ao editar, a proposta volta a valer (reabre se tinha expirado ou sido recusada)
  const status = p.primeiraAberturaEm ? "ABERTA" : "PUBLICADA";

  await db.proposta.update({
    where: { id },
    data: {
      dados: json(r.dados),
      clienteNome: r.clienteNome,
      contatoId: r.contatoId,
      snapshot: json({ ...snap, catalogo }),
      calculo: json(calculo),
      valorMensal: calculo.totalMensal,
      valorUnico: calculo.totalUnico,
      validaAte,
      descontoAcimaLimite: calculo.desconto.acimaLimite,
      status,
      decididaEm: null,
      decisaoNome: null,
      motivoRecusa: null,
      comentarioDecisao: null,
      eventos: { create: { tipo: "EDITADA", dados: json({ nome: s.usuario.nome }) } },
    },
  });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EDITAR", entidade: "Proposta", entidadeId: id, descricao: p.codigo });
  revalidatePath(`/admin/propostas/${id}`);
  return { id, link: linkPublico(s.empresa.dominioPropostas, p.slug), codigo: p.codigo };
}

export async function excluirProposta(id: string) {
  const s = await exigirAcao("propostas", "excluir");
  const p = await db.proposta.findFirst({ where: { id, ...filtroPropostas(s) } });
  if (!p) return;
  await db.proposta.delete({ where: { id } });
  await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "EXCLUIR", entidade: "Proposta", entidadeId: id, descricao: `${p.codigo} ${p.clienteNome}` });
  revalidatePath("/admin/propostas");
  redirect("/admin/propostas");
}

/** Gera o contrato no D4Sign a partir de uma proposta aceita (disparo manual). */
export async function gerarContratoProposta(id: string): Promise<{ ok: true; status: string } | { erro: string }> {
  let s;
  try { s = await exigirAcao("propostas", "editar"); } catch (e) { if (e instanceof SemPermissao) return { erro: e.message }; throw e; }
  const p = await db.proposta.findFirst({ where: { id, ...filtroPropostas(s) }, include: { empresa: true } });
  if (!p) return { erro: "Proposta não encontrada." };
  if (p.status !== "ACEITA") return { erro: "O contrato só pode ser gerado depois que o cliente aceitar a proposta." };
  const cfg = (p.empresa.d4sign ?? null) as D4SignConfig | null;
  if (!d4signPronto(cfg)) return { erro: "O D4Sign ainda não está configurado para esta empresa (veja Empresa e marca)." };
  const jaTem = p.contrato as ContratoProposta | null;
  if (jaTem?.uuid && jaTem.status !== "CANCELADO") return { erro: "Esta proposta já tem contrato no D4Sign." };

  try {
    const contrato = await gerarContrato(
      { nome: p.empresa.nome, d4sign: cfg },
      {
        codigo: p.codigo,
        titulo: p.titulo,
        clienteNome: p.clienteNome,
        valorMensal: p.valorMensal ? Number(p.valorMensal) : null,
        valorUnico: p.valorUnico ? Number(p.valorUnico) : null,
        dadosContratacao: (p.dadosContratacao ?? null) as { razaoSocial?: string; cnpj?: string; nomeSocio?: string; email?: string; whatsapp?: string } | null,
      },
    );
    await db.proposta.update({ where: { id }, data: { contrato: json(contrato), eventos: { create: { tipo: "CONTRATO_ENVIADO", dados: json({ nome: s.usuario.nome, uuid: contrato.uuid }) } } } });
    await auditar({ usuarioId: s.usuario.id, empresaId: s.empresa.id, acao: "CONTRATO", entidade: "Proposta", entidadeId: id, descricao: `${p.codigo} → D4Sign ${contrato.uuid}` });
    revalidatePath(`/admin/propostas/${id}`);
    return { ok: true, status: contrato.status };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao gerar o contrato no D4Sign." };
  }
}
