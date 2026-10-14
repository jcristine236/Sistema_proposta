// Aceite, recusa ou comentário feito pelo cliente na página pública.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hostPermitido } from "@/lib/publico";
import { avisar } from "@/lib/avisos";
import { brl } from "@/lib/formato";

const Corpo = z.object({
  acao: z.enum(["aceitar", "recusar", "comentar"]),
  nome: z.string().trim().min(1).max(120),
  email: z.string().trim().max(160).optional().default(""),
  motivo: z.string().trim().max(120).optional().default(""),
  texto: z.string().trim().max(2000).optional().default(""),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parse = Corpo.safeParse(await req.json().catch(() => null));
  if (!parse.success) return NextResponse.json({ erro: "Preencha seu nome." }, { status: 400 });
  const { acao, nome, email, motivo, texto } = parse.data;

  const p = await db.proposta.findUnique({ where: { slug }, include: { empresa: true, autor: { select: { nome: true, email: true } } } });
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!p || p.status === "RASCUNHO" || !hostPermitido(host, p.empresa.dominioPropostas)) {
    return NextResponse.json({ erro: "Proposta não encontrada." }, { status: 404 });
  }

  if (acao === "comentar") {
    if (!texto) return NextResponse.json({ erro: "Escreva sua mensagem." }, { status: 400 });
    await db.evento.create({ data: { propostaId: p.id, tipo: "COMENTARIO", dados: { nome, email, texto } } });
    await avisar(p, `Novo comentário de ${nome}`, `${nome}${email ? ` (${email})` : ""} comentou na proposta de ${p.clienteNome}:\n\n"${texto}"`);
    return NextResponse.json({ ok: true });
  }

  const expirada = p.status === "EXPIRADA" || (p.validaAte && p.validaAte < new Date());
  if (expirada) return NextResponse.json({ erro: "Esta proposta expirou. Fale com quem a enviou." }, { status: 409 });
  if (p.status === "ACEITA" || p.status === "RECUSADA") return NextResponse.json({ erro: "Esta proposta já foi respondida." }, { status: 409 });
  if (acao === "recusar" && !motivo) return NextResponse.json({ erro: "Selecione um motivo." }, { status: 400 });

  const status = acao === "aceitar" ? "ACEITA" : "RECUSADA";
  await db.proposta.update({
    where: { id: p.id },
    data: { status, decididaEm: new Date(), decisaoNome: nome, motivoRecusa: acao === "recusar" ? motivo : null, comentarioDecisao: texto || null },
  });
  await db.evento.create({ data: { propostaId: p.id, tipo: status, dados: { nome, email, motivo, texto } } });
  await avisar(
    p,
    acao === "aceitar" ? `🎉 ${p.clienteNome} aceitou a proposta` : `${p.clienteNome} recusou a proposta`,
    acao === "aceitar"
      ? `${nome}${email ? ` (${email})` : ""} aceitou a proposta: ${brl(Number(p.valorMensal ?? 0))}/mês + ${brl(Number(p.valorUnico ?? 0))} único.${texto ? `\n\nComentário: "${texto}"` : ""}`
      : `${nome} recusou a proposta. Motivo: ${motivo}.${texto ? `\n\nComentário: "${texto}"` : ""}`,
  );
  return NextResponse.json({ ok: true });
}
