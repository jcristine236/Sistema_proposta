// Recebe uma imagem do painel (editor de modelos, logos) e devolve a URL pública.
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { DIR_UPLOADS, MAX_UPLOAD, tipoImagem } from "@/lib/uploads";
import { cookies } from "next/headers";
import { COOKIE_EMPRESA } from "@/lib/sessao";
import { dentroDoLimite } from "@/lib/limite";

export async function POST(req: NextRequest) {
  const u = await usuarioAtual();
  if (!u || u.trocarSenha) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  if (!pode(u, "modelos", "editar") && !pode(u, "modelos", "criar") && !pode(u, "empresa", "editar")) {
    return NextResponse.json({ erro: "Sem permissão para enviar imagens." }, { status: 403 });
  }
  if (!dentroDoLimite(`upload:${u.id}`, 60, 60 * 60 * 1000)) return NextResponse.json({ erro: "Muitos envios. Tente mais tarde." }, { status: 429 });

  // Empresa ativa do usuário (mesma regra do painel)
  const slug = (await cookies()).get(COOKIE_EMPRESA)?.value;
  const empresas = u.superAdmin || u.todasEmpresas ? await db.empresa.findMany({ where: { ativo: true } }) : u.membros.map((m) => m.empresa);
  const empresa = empresas.find((e) => e.slug === slug) ?? empresas[0];
  if (!empresa) return NextResponse.json({ erro: "Sem empresa." }, { status: 403 });

  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD + 100_000) return NextResponse.json({ erro: "Imagem maior que 5 MB." }, { status: 413 });
  const form = await req.formData().catch(() => null);
  const arq = form?.get("arquivo");
  if (!(arq instanceof File)) return NextResponse.json({ erro: "Envie um arquivo." }, { status: 400 });
  if (arq.size > MAX_UPLOAD) return NextResponse.json({ erro: "Imagem maior que 5 MB." }, { status: 413 });
  const bytes = new Uint8Array(await arq.arrayBuffer());
  const tipo = tipoImagem(bytes);
  if (!tipo) return NextResponse.json({ erro: "Formato não aceito. Use PNG, JPG, WebP ou GIF." }, { status: 415 });

  const nome = `${randomBytes(16).toString("hex")}.${tipo.ext}`;
  await mkdir(DIR_UPLOADS, { recursive: true });
  await writeFile(path.join(DIR_UPLOADS, nome), bytes, { flag: "wx" });
  await db.upload.create({ data: { empresaId: empresa.id, arquivo: nome, nome: arq.name.slice(0, 200), mime: tipo.mime, tamanho: arq.size } });
  return NextResponse.json({ url: `/uploads/${nome}` });
}
