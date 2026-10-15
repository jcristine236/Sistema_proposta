// Armazenamento de imagens enviadas. Os arquivos ficam em UPLOAD_DIR (volume
// persistente no Docker) com nome aleatório; o tipo é conferido pelos bytes.
import "server-only";
import path from "node:path";

export const MAX_UPLOAD = 5 * 1024 * 1024;
export const DIR_UPLOADS = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

/** Identifica PNG, JPEG, WebP e GIF pelos primeiros bytes (não confia na extensão). */
export function tipoImagem(b: Uint8Array): { mime: string; ext: string } | null {
  const h = (i: number, ...v: number[]) => v.every((x, k) => b[i + k] === x);
  if (h(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png" };
  if (h(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (h(0, 0x52, 0x49, 0x46, 0x46) && h(8, 0x57, 0x45, 0x42, 0x50)) return { mime: "image/webp", ext: "webp" };
  if (h(0, 0x47, 0x49, 0x46, 0x38)) return { mime: "image/gif", ext: "gif" };
  return null;
}

export const NOME_ARQUIVO = /^[a-f0-9]{32}\.(png|jpg|webp|gif)$/;
