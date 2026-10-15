import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { favoritasDaEmpresa } from "@/lib/editor";
import { FONTES, temaDe } from "@/lib/tema";
import type { Campo } from "@/lib/campos";
import type { Precificacao } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { EditorModelo } from "@/components/editor/EditorModelo";
import "../../../../p/proposta.css";

export default async function EditarModelo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirSessao("modelos");
  const m = await db.modelo.findFirst({ where: { id, empresaId: s.empresa.id } });
  if (!m) notFound();
  const [catalogo, favoritas] = await Promise.all([catalogoDaEmpresa(s.empresa.id), favoritasDaEmpresa(s.empresa.id)]);
  return (
    <>
      <link rel="stylesheet" href={FONTES.url} precedence="default" />
      <EditorModelo
        modo="modelo"
        inicial={{
          id: m.id, nome: m.nome, descricao: m.descricao ?? "", tipoSolucao: m.tipoSolucao, validadeDias: m.validadeDias,
          campos: m.campos as Campo[], secoes: m.secoes as Secao[], precificacao: m.precificacao as Precificacao,
        }}
        favoritas={favoritas}
        catalogo={catalogo}
        empresa={{ nome: s.empresa.razaoSocial ?? s.empresa.nome, site: s.empresa.site, rodape: s.empresa.rodape }}
        tema={temaDe(s.empresa.tema)}
        podeEditar={s.permite("modelos", "editar")}
      />
    </>
  );
}
