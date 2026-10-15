import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { FONTES, temaDe } from "@/lib/tema";
import type { Secao } from "@/lib/secoes";
import { EditorModelo } from "@/components/editor/EditorModelo";
import "../../../../p/proposta.css";

export default async function EditarSecao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirSessao("modelos");
  const sec = await db.secaoModelo.findFirst({ where: { id, empresaId: s.empresa.id } });
  if (!sec) notFound();
  return (
    <>
      <link rel="stylesheet" href={FONTES.url} precedence="default" />
      <EditorModelo
        modo="secao"
        secaoModeloId={sec.id}
        inicial={{ nome: sec.nome, descricao: "", tipoSolucao: "", validadeDias: 15, campos: [], secoes: [sec.secao as unknown as Secao], precificacao: {} }}
        favoritas={[]}
        catalogo={await catalogoDaEmpresa(s.empresa.id)}
        empresa={{ nome: s.empresa.razaoSocial ?? s.empresa.nome, site: s.empresa.site, rodape: s.empresa.rodape }}
        tema={temaDe(s.empresa.tema)}
        podeEditar={s.permite("modelos", "editar")}
      />
    </>
  );
}
