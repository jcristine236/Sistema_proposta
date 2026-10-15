import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao, filtroPropostas } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { FONTES, temaDe } from "@/lib/tema";
import type { Campo, Dados } from "@/lib/campos";
import type { Precificacao } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { FormularioProposta } from "@/components/admin/FormularioProposta";

export default async function NovaProposta({ params, searchParams }: { params: Promise<{ modeloId: string }>; searchParams: Promise<{ de?: string }> }) {
  const { modeloId } = await params;
  const { de } = await searchParams;
  const s = await exigirSessao("propostas", "criar");
  const modelo = await db.modelo.findFirst({ where: { id: modeloId, empresaId: s.empresa.id, ativo: true } });
  if (!modelo) notFound();
  // Duplicar: reaproveita os dados de outra proposta (exceto validade, que recomeça)
  let dadosIniciais: Dados | undefined;
  if (de) {
    const origem = await db.proposta.findFirst({ where: { id: de, ...filtroPropostas(s) } });
    if (origem) {
      dadosIniciais = { ...(origem.dados as Dados) };
      for (const c of modelo.campos as Campo[]) if (c.tipo === "data") delete dadosIniciais[c.id];
    }
  }
  const [catalogo, contatos] = await Promise.all([
    catalogoDaEmpresa(s.empresa.id),
    db.contato.findMany({ where: { empresaId: s.empresa.id, ativo: true }, select: { id: true, organizacao: true }, orderBy: { organizacao: "asc" } }),
  ]);
  return (
    <>
      <link rel="stylesheet" href={FONTES.url} precedence="default" />
      <FormularioProposta
        modelo={{ id: modelo.id, nome: modelo.nome, campos: modelo.campos as Campo[], secoes: modelo.secoes as Secao[], precificacao: modelo.precificacao as Precificacao }}
        catalogo={catalogo}
        contatos={contatos}
        empresa={{ nome: s.empresa.razaoSocial ?? s.empresa.nome, site: s.empresa.site, rodape: s.empresa.rodape }}
        tema={temaDe(s.empresa.tema)}
        dominio={s.empresa.dominioPropostas}
        dadosIniciais={dadosIniciais}
      />
    </>
  );
}
