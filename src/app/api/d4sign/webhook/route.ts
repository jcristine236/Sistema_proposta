import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statusDoWebhook, type ContratoProposta } from "@/lib/d4sign";
import { avisar } from "@/lib/avisos";

// Webhook do D4Sign: chamado quando o status de um documento muda (ex.: assinado).
// Proteção simples por token na URL: /api/d4sign/webhook?token=XYZ
// (configure D4SIGN_WEBHOOK_TOKEN no .env e cadastre esta URL com ?token no D4Sign).
export async function POST(req: Request) {
  const token = process.env.D4SIGN_WEBHOOK_TOKEN;
  if (token) {
    const url = new URL(req.url);
    if (url.searchParams.get("token") !== token) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  let payload: Record<string, unknown> = {};
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) payload = await req.json();
    else {
      const form = await req.formData();
      payload = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    }
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const uuid = String(payload.uuid ?? payload.uuidDoc ?? payload.uuid_document ?? "");
  const novo = statusDoWebhook(payload);
  if (!uuid || !novo) return NextResponse.json({ ok: true, ignorado: true });

  const p = await db.proposta.findFirst({
    where: { contrato: { path: ["uuid"], equals: uuid } },
    include: {
      empresa: { select: { nome: true, dominioPropostas: true, emailNotificacao: true, whatsappNotificacao: true } },
      autor: { select: { nome: true, email: true, whatsapp: true } },
    },
  });
  if (!p) return NextResponse.json({ ok: true, naoEncontrado: true });

  const atual = (p.contrato ?? {}) as ContratoProposta;
  if (atual.status === novo) return NextResponse.json({ ok: true });

  const contrato: ContratoProposta = { ...atual, status: novo, ...(novo === "ASSINADO" ? { assinadoEm: new Date().toISOString() } : {}) };
  await db.proposta.update({
    where: { id: p.id },
    data: { contrato: contrato as unknown as object, eventos: { create: { tipo: novo === "ASSINADO" ? "CONTRATO_ASSINADO" : "CONTRATO_CANCELADO", dados: { uuid } } } },
  });

  if (novo === "ASSINADO") {
    await avisar(p, `Contrato assinado — ${p.codigo}`, [
      `O contrato da proposta ${p.codigo} (${p.clienteNome}) foi assinado no D4Sign.`,
      `Documento: ${uuid}`,
    ].join("\n"));
  }
  return NextResponse.json({ ok: true });
}
