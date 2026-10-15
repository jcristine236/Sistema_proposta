import "server-only";
import { enviarAviso } from "./email";
import { enviarWhatsapp } from "./whatsapp";
import { linkPublico } from "./links";

type PropostaAviso = {
  id: string;
  codigo: string;
  slug: string;
  clienteNome: string;
  empresa: { nome: string; dominioPropostas: string; emailNotificacao: string | null; whatsappNotificacao: string | null };
  autor: { nome: string; email: string; whatsapp?: string | null };
};

/**
 * Avisa o autor da proposta e os contatos de notificação da empresa.
 * whatsapp=true também envia por WhatsApp (aceite e dados de contratação).
 */
export async function avisar(p: PropostaAviso, assunto: string, corpo: string, opts: { whatsapp?: boolean } = {}) {
  const base = process.env.ADMIN_BASE_URL?.replace(/\/$/, "");
  const painel = base ? `${base}/admin/propostas/${p.id}` : `/admin/propostas/${p.id}`;
  const texto = `${corpo}\n\nProposta ${p.codigo}: ${linkPublico(p.empresa.dominioPropostas, p.slug)}\nAcompanhar: ${painel}`;
  const emails = [p.autor.email, p.empresa.emailNotificacao].filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
  const tarefas: Promise<unknown>[] = emails.map((d) => enviarAviso(d, `[${p.empresa.nome}] ${p.codigo} · ${assunto}`, texto));
  if (opts.whatsapp) {
    const numeros = [p.empresa.whatsappNotificacao, p.autor.whatsapp].filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
    tarefas.push(...numeros.map((n) => enviarWhatsapp(n, `*${p.empresa.nome} · ${assunto}*\n${texto}`, { evento: assunto, proposta: p.codigo })));
  }
  await Promise.all(tarefas);
}
