import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao, filtroPropostas } from "@/lib/auth";
import { catalogoDaEmpresa } from "@/lib/catalogo";
import { FONTES, temaDe } from "@/lib/tema";
import type { Campo, Dados } from "@/lib/campos";
import { catalogoDoModelo, type Precificacao } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { FormularioProposta } from "@/components/admin/FormularioProposta";

export default async function EditarProposta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirSessao("propostas", "editar");
  const p = await db.proposta.findFirst({ where: { id, ...filtroPropostas(s) } });
  if (!p) notFound();
  if (p.status === "ACEITA") redirect(`/admin/propostas/${id}`);
  const snap = p.snapshot as { campos: Campo[]; secoes: Secao[]; precificacao: Precificacao; modeloNome?: string };
  const [catalogo, contatos] = await Promise.all([
    catalogoDaEmpresa(s.empresa.id),
    db.contato.findMany({ where: { empresaId: s.empresa.id, ativo: true }, select: { id: true, organizacao: true }, orderBy: { organizacao: "asc" } }),
  ]);
  return (
    <>
      <link rel="stylesheet" href={FONTES.url} precedence="default" />
      <FormularioProposta
        modelo={{ id: p.modeloId ?? "", nome: snap.modeloNome ?? "Proposta", campos: snap.campos, secoes: snap.secoes, precificacao: snap.precificacao }}
        catalogo={catalogoDoModelo(snap.campos, catalogo)}
        contatos={contatos}
        empresa={{ nome: s.empresa.razaoSocial ?? s.empresa.nome, site: s.empresa.site, rodape: s.empresa.rodape }}
        tema={temaDe(s.empresa.tema)}
        dominio={s.empresa.dominioPropostas}
        editar={{ id: p.id, codigo: p.codigo }}
        dadosIniciais={p.dados as Dados}
      />
    </>
  );
}
