// Recebe a abertura e os tempos de leitura enviados pela página pública.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";
import { hostPermitido } from "@/lib/publico";
import { avisar } from "@/lib/avisos";
import type { Secao } from "@/lib/secoes";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/limite";

const Abrir = z.object({ acao: z.literal("abrir"), slug: z.string().max(80), viewerId: z.string().max(64) });
const Tempo = z.object({
  acao: z.literal("tempo"),
  slug: z.string().max(80),
  visualizacaoId: z.string().max(40),
  total: z.number().int().min(0).max(600),
  secoes: z.record(z.string().max(60), z.number().int().min(0).max(600)),
});

function host(req: NextRequest) {
  return (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
}

export async function POST(req: NextRequest) {
  if (!dentroDoLimite(`rastreio:${ipDaRequisicao(req)}`, 240, 10 * 60 * 1000)) return NextResponse.json({ erro: "limite" }, { status: 429 });
  const bruto = await req.text();
  if (bruto.length > 8000) return NextResponse.json({ erro: "corpo grande demais" }, { status: 413 });
  let corpo: unknown;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  // Usuário logado no painel (equipe interna) não conta como leitura do cliente
  if (await lerToken(req.cookies.get(COOKIE_SESSAO)?.value)) return NextResponse.json({ visualizacaoId: null, interno: true });

  const abrir = Abrir.safeParse(corpo);
  if (abrir.success) {
    const p = await db.proposta.findUnique({
      where: { slug: abrir.data.slug },
      include: { empresa: true, autor: { select: { nome: true, email: true, whatsapp: true } } },
    });
    if (!p || p.status === "RASCUNHO" || !hostPermitido(host(req), p.empresa.dominioPropostas)) {
      return NextResponse.json({ erro: "não encontrada" }, { status: 404 });
    }
    const leitorNovo = !(await db.visualizacao.findFirst({ where: { propostaId: p.id, viewerId: abrir.data.viewerId } }));
    const v = await db.visualizacao.create({
      data: {
        propostaId: p.id,
        viewerId: abrir.data.viewerId,
        userAgent: req.headers.get("user-agent")?.slice(0, 300),
        ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
      },
    });
    if (!p.primeiraAberturaEm) {
      await db.proposta.update({
        where: { id: p.id },
        data: { primeiraAberturaEm: new Date(), ...(p.status === "PUBLICADA" ? { status: "ABERTA" } : {}) },
      });
      await db.evento.create({ data: { propostaId: p.id, tipo: "ABERTA" } });
      await avisar(p, `${p.clienteNome} abriu a proposta`, `${p.clienteNome} acabou de abrir a proposta ${p.codigo} enviada por ${p.autor.nome}.`);
    } else if (leitorNovo) {
      await db.evento.create({ data: { propostaId: p.id, tipo: "REABERTA", dados: { nome: "novo leitor" } } });
    }
    return NextResponse.json({ visualizacaoId: v.id });
  }

  const tempo = Tempo.safeParse(corpo);
  if (tempo.success) {
    const { visualizacaoId, slug, total, secoes } = tempo.data;
    const v = await db.visualizacao.findFirst({ where: { id: visualizacaoId, proposta: { slug } }, include: { proposta: { select: { snapshot: true } } } });
    if (!v) return NextResponse.json({ erro: "visualização inválida" }, { status: 404 });
    const validas = new Set(((v.proposta.snapshot as { secoes?: Secao[] }).secoes ?? []).map((s) => s.id));
    const itens = Object.entries(secoes).filter(([id, seg]) => validas.has(id) && seg > 0);
    await db.$transaction([
      db.visualizacao.update({ where: { id: v.id }, data: { tempoTotalSeg: { increment: total }, ultimaAtividade: new Date() } }),
      ...itens.map(([secao, seg]) =>
        db.tempoSecao.upsert({
          where: { visualizacaoId_secao: { visualizacaoId: v.id, secao } },
          update: { segundos: { increment: seg } },
          create: { visualizacaoId: v.id, secao, segundos: seg },
        }),
      ),
    ]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "ação inválida" }, { status: 400 });
}
