import "server-only";
import { enviarAviso } from "./email";
import { linkPublico } from "./links";

type PropostaAviso = {
  id: string;
  slug: string;
  clienteNome: string;
  empresa: { nome: string; dominioPropostas: string; emailNotificacao: string | null };
  autor: { nome: string; email: string };
};

/** Avisa o autor da proposta (e o e-mail de notificação da empresa, se houver). */
export async function avisar(p: PropostaAviso, assunto: string, corpo: string) {
  const base = process.env.ADMIN_BASE_URL?.replace(/\/$/, "");
  const painel = base ? `${base}/admin/propostas/${p.id}` : `/admin/propostas/${p.id}`;
  const texto = `${corpo}\n\nProposta: ${linkPublico(p.empresa.dominioPropostas, p.slug)}\nAcompanhar: ${painel}`;
  const destinos = [p.autor.email, p.empresa.emailNotificacao].filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
  await Promise.all(destinos.map((d) => enviarAviso(d, `[${p.empresa.nome}] ${assunto}`, texto)));
}
