import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { dataBR } from "@/lib/formato";
import { FormAcao } from "@/components/admin/FormAcao";
import { BotaoConfirmar } from "@/components/admin/Confirmar";
import { excluirContato, salvarContato } from "../cadastros";

export default async function Contatos({ searchParams }: { searchParams: Promise<{ editar?: string; q?: string }> }) {
  const s = await exigirSessao("clientes");
  const { editar, q } = await searchParams;
  const busca = (q ?? "").trim().slice(0, 80);
  const contatos = await db.contato.findMany({
    where: { empresaId: s.empresa.id, ativo: true, ...(busca ? { OR: [{ organizacao: { contains: busca, mode: "insensitive" } }, { cnpj: { contains: busca } }, { responsavel: { contains: busca, mode: "insensitive" } }] } : {}) },
    orderBy: { organizacao: "asc" },
    include: { _count: { select: { propostas: true } } },
  });
  const atual = editar ? await db.contato.findFirst({ where: { id: editar, empresaId: s.empresa.id } }) : null;
  const podeForm = atual ? s.permite("clientes", "editar") : s.permite("clientes", "criar");
  return (
    <>
      <div className="topo"><div><h1>Clientes</h1><p>Também são cadastrados ao gerar uma proposta e completados com os dados do aceite.</p></div>
        <form style={{ display: "flex", gap: 6 }}><input name="q" defaultValue={busca} placeholder="Buscar por nome, CNPJ ou responsável" className="input-inline" style={{ width: 280 }} /><button className="btn claro pequeno">Buscar</button></form>
      </div>
      <div className="grade g2">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Cliente</th><th>Responsável</th><th>Contato</th><th>Propostas</th><th style={{ textAlign: "right" }}>Ações</th></tr></thead>
            <tbody>
              {contatos.map((c) => (
                <tr key={c.id} style={{ background: c.id === editar ? "var(--accent-soft)" : undefined }}>
                  <td><b>{c.organizacao}</b>{c.razaoSocial && <div className="muted" style={{ fontSize: 12.5 }}>{c.razaoSocial}</div>}{c.cnpj && <div className="mono muted" style={{ fontSize: 12 }}>{c.cnpj}</div>}</td>
                  <td>{c.responsavel ?? <span className="muted">-</span>}</td>
                  <td style={{ fontSize: 13 }}>{c.email ?? ""}{c.celular && <div className="muted">{c.celular}</div>}</td>
                  <td>{c._count.propostas}<div className="muted" style={{ fontSize: 12 }}>desde {dataBR(c.criadoEm)}</div></td>
                  <td>
                    <div className="acoes-linha">
                      {s.permite("clientes", "editar") && <Link className="btn claro pequeno" href={`/admin/contatos?editar=${c.id}`}>Editar</Link>}
                      {s.permite("clientes", "excluir") && <form action={excluirContato.bind(null, c.id)}><BotaoConfirmar mensagem={`Excluir "${c.organizacao}"? As propostas continuam com o nome do cliente.`}>Excluir</BotaoConfirmar></form>}
                    </div>
                  </td>
                </tr>
              ))}
              {contatos.length === 0 && <tr><td colSpan={5} className="vazio">Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        {podeForm && (
          <div className="card">
            <h2>{atual ? `Editar ${atual.organizacao}` : "Novo cliente"}</h2>
            <FormAcao key={atual?.id ?? "novo"} acao={salvarContato} botao={atual ? "Salvar alterações" : "Cadastrar cliente"} cancelar={atual && <Link href="/admin/contatos" className="muted">Cancelar</Link>}>
              {atual && <input type="hidden" name="id" value={atual.id} />}
              <div className="campo"><label>Nome do cliente (como aparece na proposta)</label><input name="organizacao" defaultValue={atual?.organizacao} required /></div>
              <div className="linha2">
                <div className="campo"><label>Razão social</label><input name="razaoSocial" defaultValue={atual?.razaoSocial ?? ""} /></div>
                <div className="campo"><label>CNPJ</label><input name="cnpj" defaultValue={atual?.cnpj ?? ""} /></div>
              </div>
              <div className="campo"><label>Responsável</label><input name="responsavel" defaultValue={atual?.responsavel ?? ""} /></div>
              <div className="linha2">
                <div className="campo"><label>E-mail</label><input name="email" type="email" defaultValue={atual?.email ?? ""} /></div>
                <div className="campo"><label>Celular</label><input name="celular" defaultValue={atual?.celular ?? ""} placeholder="(11) 91234-5678" /></div>
              </div>
            </FormAcao>
          </div>
        )}
      </div>
    </>
  );
}
