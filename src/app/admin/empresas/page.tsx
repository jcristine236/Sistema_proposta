import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { FormAcao } from "@/components/admin/FormAcao";
import { alternarEmpresa, salvarEmpresaPlataforma } from "../cadastros";

export default async function Empresas({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const s = await exigirSessao();
  if (!s.usuario.superAdmin) redirect("/admin/sem-permissao");
  const { editar } = await searchParams;
  const empresas = await db.empresa.findMany({ orderBy: { nome: "asc" }, include: { _count: { select: { propostas: true, membros: true } } } });
  const atual = editar ? empresas.find((e) => e.id === editar) : undefined;
  return (
    <>
      <div className="topo"><div><h1>Empresas</h1><p>Empresas da plataforma: cada uma com domínio, prefixo de numeração, marca e cadastros próprios.</p></div></div>
      <div className="grade g2">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Empresa</th><th>Domínio dos links</th><th>Prefixo</th><th>Propostas</th><th style={{ textAlign: "right" }}>Ações</th></tr></thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id} style={{ opacity: e.ativo ? 1 : 0.5 }}>
                  <td><b>{e.nome}</b><div className="muted" style={{ fontSize: 12 }}>{e.slug}</div></td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{e.dominioPropostas}</td>
                  <td className="mono">{e.prefixo}</td>
                  <td>{e._count.propostas}</td>
                  <td>
                    <div className="acoes-linha">
                      <Link className="btn claro pequeno" href={`/admin/empresas?editar=${e.id}`}>Editar</Link>
                      <form action={alternarEmpresa.bind(null, e.id)}><button className="btn claro pequeno">{e.ativo ? "Desativar" : "Ativar"}</button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>{atual ? `Editar ${atual.nome}` : "Nova empresa"}</h2>
          <FormAcao key={atual?.id ?? "nova"} acao={salvarEmpresaPlataforma} botao={atual ? "Salvar" : "Criar empresa"} cancelar={atual && <Link href="/admin/empresas" className="muted">Cancelar</Link>}>
            {atual && <input type="hidden" name="id" value={atual.id} />}
            <div className="linha2">
              <div className="campo"><label>Nome</label><input name="nome" defaultValue={atual?.nome} required /></div>
              <div className="campo"><label>Identificador</label><input name="slug" defaultValue={atual?.slug} placeholder="empresa" required /></div>
            </div>
            <div className="linha2">
              <div className="campo"><label>Prefixo dos números</label><input name="prefixo" defaultValue={atual?.prefixo} placeholder="EMP" required /><div className="ajuda">Ex.: EMP-2026-0001</div></div>
              <div className="campo"><label>Domínio dos links</label><input name="dominioPropostas" defaultValue={atual?.dominioPropostas} placeholder="propostas.empresa.com.br" required /></div>
            </div>
            <div className="linha2">
              <div className="campo"><label>Razão social</label><input name="razaoSocial" defaultValue={atual?.razaoSocial ?? ""} /></div>
              <div className="campo"><label>Site</label><input name="site" defaultValue={atual?.site ?? ""} /></div>
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>Depois de criar, selecione a empresa no menu lateral para configurar cores e logos. Inclua o novo domínio no Caddyfile e no DNS.</p>
          </FormAcao>
        </div>
      </div>
    </>
  );
}
