import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Campo, Dados } from "@/lib/campos";
import { montarContexto } from "@/lib/contexto";
import type { Precificacao, ProdutoCatalogo } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { temaDe, urlFontes } from "@/lib/tema";
import { propostaPublica } from "@/lib/publico";
import { PropostaView } from "@/components/proposta/PropostaView";
import "../proposta.css";

export const dynamic = "force-dynamic";

type Snapshot = { campos: Campo[]; secoes: Secao[]; precificacao: Precificacao; catalogo: ProdutoCatalogo[] };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await propostaPublica((await params).slug);
  if (!p) return { title: "Proposta" };
  const tema = temaDe(p.empresa.tema);
  return {
    title: `Proposta para ${p.clienteNome} · ${p.empresa.nome}`,
    robots: { index: false, follow: false },
    icons: tema.logo ? [{ url: tema.logo }] : undefined,
  };
}

export default async function PaginaProposta({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await propostaPublica(slug);
  if (!p) notFound();

  const snap = p.snapshot as Snapshot;
  const tema = temaDe(p.empresa.tema);
  const ctx = montarContexto({
    campos: snap.campos,
    precificacao: snap.precificacao,
    dados: p.dados as Dados,
    catalogo: snap.catalogo ?? [],
    empresa: { nome: p.empresa.razaoSocial ?? p.empresa.nome, site: p.empresa.site, rodape: p.empresa.rodape },
  });
  const decisao = p.status === "ACEITA" || p.status === "RECUSADA" ? p.status : null;

  return (
    <>
      <link rel="stylesheet" href={urlFontes(tema)} precedence="default" />
      <PropostaView secoes={snap.secoes} ctx={ctx} tema={tema} modo="publico" slug={slug} decisao={decisao} />
    </>
  );
}
