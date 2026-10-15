// Aceite (com dados para contrato), recusa ou comentário feito pelo cliente na página pública.
import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hostPermitido } from "@/lib/publico";
import { avisar } from "@/lib/avisos";
import { brl } from "@/lib/formato";
import { cnpjValido, emailValido, formatarCnpj, formatarTelefone, telefoneValido } from "@/lib/documentos";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/limite";

const txt = (max: number) => z.string().trim().max(max).optional().default("");
const Corpo = z.object({
  acao: z.enum(["aceitar", "recusar", "comentar"]),
  nome: txt(120),
  email: txt(160),
  motivo: txt(120),
  texto: txt(2000),
  razaoSocial: txt(200),
  cnpj: txt(20),
  nomeSocio: txt(120),
  whatsapp: txt(20),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = ipDaRequisicao(req);
  if (!dentroDoLimite(`decisao:${ip}`, 20, 10 * 60 * 1000)) return NextResponse.json({ erro: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  const { slug } = await params;
  const parse = Corpo.safeParse(await req.json().catch(() => null));
  if (!parse.success) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const d = parse.data;

  const p = await db.proposta.findUnique({ where: { slug }, include: { empresa: true, autor: { select: { nome: true, email: true, whatsapp: true } } } });
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
  if (!p || p.status === "RASCUNHO" || !hostPermitido(host, p.empresa.dominioPropostas)) {
    return NextResponse.json({ erro: "Proposta não encontrada." }, { status: 404 });
  }

  if (d.acao === "comentar") {
    if (!d.nome || !d.texto) return NextResponse.json({ erro: "Informe seu nome e a mensagem." }, { status: 400 });
    await db.evento.create({ data: { propostaId: p.id, tipo: "COMENTARIO", dados: { nome: d.nome, email: d.email, texto: d.texto } } });
    await avisar(p, `Novo comentário de ${d.nome}`, `${d.nome}${d.email ? ` (${d.email})` : ""} comentou na proposta de ${p.clienteNome}:\n\n"${d.texto}"`);
    return NextResponse.json({ ok: true });
  }

  const expirada = p.status === "EXPIRADA" || (p.validaAte && p.validaAte < new Date());
  if (expirada) return NextResponse.json({ erro: "Esta proposta expirou. Fale com quem a enviou." }, { status: 409 });
  if (p.status === "ACEITA" || p.status === "RECUSADA") return NextResponse.json({ erro: "Esta proposta já foi respondida." }, { status: 409 });

  if (d.acao === "recusar") {
    if (!d.nome) return NextResponse.json({ erro: "Informe seu nome." }, { status: 400 });
    if (!d.motivo) return NextResponse.json({ erro: "Selecione um motivo." }, { status: 400 });
    await db.proposta.update({ where: { id: p.id }, data: { status: "RECUSADA", decididaEm: new Date(), decisaoNome: d.nome, motivoRecusa: d.motivo, comentarioDecisao: d.texto || null } });
    await db.evento.create({ data: { propostaId: p.id, tipo: "RECUSADA", dados: { nome: d.nome, email: d.email, motivo: d.motivo, texto: d.texto } } });
    await avisar(p, `${p.clienteNome} recusou a proposta`, `${d.nome} recusou a proposta. Motivo: ${d.motivo}.${d.texto ? `\n\nComentário: "${d.texto}"` : ""}`);
    return NextResponse.json({ ok: true });
  }

  // Aceite: exige os dados para o contrato
  const erros: string[] = [];
  if (!d.razaoSocial) erros.push("Informe a razão social.");
  if (!cnpjValido(d.cnpj)) erros.push("CNPJ inválido.");
  if (!d.nomeSocio) erros.push("Informe o nome do sócio responsável.");
  if (!emailValido(d.email)) erros.push("E-mail inválido.");
  if (!telefoneValido(d.whatsapp)) erros.push("WhatsApp inválido (informe DDD + número).");
  if (erros.length) return NextResponse.json({ erro: erros.join(" ") }, { status: 400 });

  const dados = { razaoSocial: d.razaoSocial, cnpj: formatarCnpj(d.cnpj), nomeSocio: d.nomeSocio, email: d.email.toLowerCase(), whatsapp: formatarTelefone(d.whatsapp) };
  await db.proposta.update({
    where: { id: p.id },
    data: { status: "ACEITA", decididaEm: new Date(), decisaoNome: d.nomeSocio, comentarioDecisao: d.texto || null, dadosContratacao: dados as Prisma.InputJsonValue },
  });
  await db.evento.create({ data: { propostaId: p.id, tipo: "ACEITA", dados: { nome: d.nomeSocio, ...dados, texto: d.texto } } });
  if (p.contatoId) {
    await db.contato.update({
      where: { id: p.contatoId },
      data: { razaoSocial: dados.razaoSocial, cnpj: dados.cnpj, responsavel: dados.nomeSocio, email: dados.email, celular: dados.whatsapp },
    }).catch(() => {});
  }
  await avisar(
    p,
    `${p.clienteNome} ACEITOU a proposta`,
    [
      `Investimento: ${brl(Number(p.valorMensal ?? 0))}/mês + ${brl(Number(p.valorUnico ?? 0))} único.`,
      "",
      "Dados para o contrato:",
      `Razão social: ${dados.razaoSocial}`,
      `CNPJ: ${dados.cnpj}`,
      `Sócio: ${dados.nomeSocio}`,
      `E-mail: ${dados.email}`,
      `WhatsApp: ${dados.whatsapp}`,
      d.texto ? `\nComentário: "${d.texto}"` : "",
    ].join("\n"),
    { whatsapp: true },
  );
  return NextResponse.json({ ok: true });
}
