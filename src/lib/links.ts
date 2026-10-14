/** Link público de uma proposta, no domínio de propostas da empresa. */
export function linkPublico(dominioPropostas: string, slug: string) {
  const proto = process.env.PUBLIC_PROTOCOL ?? "https";
  // Em desenvolvimento, PUBLIC_BASE_URL=http://localhost:3000 força o host local.
  if (process.env.PUBLIC_BASE_URL) return `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/p/${slug}`;
  return `${proto}://${dominioPropostas}/p/${slug}`;
}
