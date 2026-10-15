// Validação de endereços usados nas seções (imagens, vídeos, botões).
// Evita javascript:, data: e outros esquemas perigosos vindos dos modelos.

/** Imagem: arquivo enviado (/uploads/...), arquivo do sistema (/empresas/...) ou https. */
export function urlImagem(u: string | undefined): string | null {
  if (!u) return null;
  const s = u.trim();
  if (/^\/(uploads|empresas)\/[\w./-]+$/.test(s) && !s.includes("..")) return s;
  try {
    const x = new URL(s);
    return x.protocol === "https:" ? x.toString() : null;
  } catch {
    return null;
  }
}

/** Link de botão: http(s), e-mail, telefone ou WhatsApp. */
export function urlLink(u: string | undefined): string | null {
  if (!u) return null;
  const s = u.trim();
  if (/^(mailto:|tel:)[^\s"'<>]+$/i.test(s)) return s;
  try {
    const x = new URL(s);
    return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : null;
  } catch {
    return null;
  }
}

/** Vídeo: converte links do YouTube/Vimeo no endereço do player incorporado. */
export function urlVideo(u: string | undefined): string | null {
  if (!u) return null;
  try {
    const x = new URL(u.trim());
    const host = x.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = x.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = x.searchParams.get("v") ?? (x.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/)?.[2] ?? null);
    }
    if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const v = x.pathname.match(/(\d{6,12})/)?.[1];
      if (v) return `https://player.vimeo.com/video/${v}`;
    }
    return null;
  } catch {
    return null;
  }
}
