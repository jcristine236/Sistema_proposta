import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { temaDe, urlFontes } from "@/lib/tema";
import type { Campo } from "@/lib/campos";
import type { Precificacao } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { FormularioProposta } from "@/components/admin/FormularioProposta";
import "../../../../p/proposta.css";

export default async function NovaProposta({ params }: { params: Promise<{ modeloId: string }> }) {
  const { modeloId } = await params;
  const { empresa } = await exigirSessao();
  const modelo = await db.modelo.findFirst({ where: { id: modeloId, empresaId: empresa.id, ativo: true } });
  if (!modelo) notFound();
  const [catalogo, contatos] = await Promise.all([
    catalogoDaEmpresa(empresa.id),
    db.contato.findMany({ where: { empresaId: empresa.id, ativo: true }, select: { id: true, organizacao: true }, orderBy: { organizacao: "asc" } }),
  ]);
  const tema = temaDe(empresa.tema);
  return (
    <>
      <link rel="stylesheet" href={urlFontes(tema)} precedence="default" />
      <FormularioProposta
        modelo={{ id: modelo.id, nome: modelo.nome, campos: modelo.campos as Campo[], secoes: modelo.secoes as Secao[], precificacao: modelo.precificacao as Precificacao }}
        catalogo={catalogo}
        contatos={contatos}
        empresa={{ nome: empresa.razaoSocial ?? empresa.nome, site: empresa.site, rodape: empresa.rodape }}
        tema={tema}
        dominio={empresa.dominioPropostas}
      />
    </>
  );
}
