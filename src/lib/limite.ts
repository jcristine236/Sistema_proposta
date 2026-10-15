// Limite simples de requisições por chave (IP, e-mail...). Em memória: vale por
// instância do servidor, o que atende uma instalação com um único contêiner.
const janelas = new Map<string, number[]>();

export function dentroDoLimite(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now();
  const lista = (janelas.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (lista.length >= max) {
    janelas.set(chave, lista);
    return false;
  }
  lista.push(agora);
  janelas.set(chave, lista);
  if (janelas.size > 50000) for (const [k, v] of janelas) if (!v.some((t) => agora - t < janelaMs)) janelas.delete(k);
  return true;
}

/** IP do cliente: a última entrada do X-Forwarded-For é a adicionada pelo nosso proxy (Caddy). */
export function ipDeCabecalhos(h: Headers): string {
  const xff = (h.get("x-forwarded-for") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return xff[xff.length - 1] ?? h.get("x-real-ip") ?? "local";
}

export function ipDaRequisicao(req: Request): string {
  return ipDeCabecalhos(req.headers);
}
