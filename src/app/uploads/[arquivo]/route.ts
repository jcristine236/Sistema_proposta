// Serve as imagens enviadas (nome aleatório, tipo conferido no envio).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DIR_UPLOADS, NOME_ARQUIVO } from "@/lib/uploads";

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export async function GET(_: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  if (!NOME_ARQUIVO.test(arquivo)) return new Response("Não encontrado", { status: 404 });
  try {
    const dados = await readFile(path.join(DIR_UPLOADS, arquivo));
    return new Response(dados, {
      headers: {
        "Content-Type": MIME[arquivo.split(".").pop()!],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
