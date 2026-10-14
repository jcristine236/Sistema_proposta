import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { dataBR } from "@/lib/formato";
import { FormAcao } from "@/components/admin/FormAcao";
import { salvarContato } from "../cadastros";

export default async function Contatos() {
  const { empresa } = await exigirSessao();
  const contatos = await db.contato.findMany({
    where: { empresaId: empresa.id, ativo: true },
    orderBy: { organizacao: "asc" },
    include: { _count: { select: { propostas: true } } },
  });
  return (
    <>
      <div className="topo"><div><h1>Clientes</h1><p>Clientes também são cadastrados automaticamente ao gerar uma proposta.</p></div></div>
      <div className="grade g2">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Empresa</th><th>Responsável</th><th>E-mail</th><th>Celular</th><th>Propostas</th><th>Desde</th></tr></thead>
            <tbody>
              {contatos.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.organizacao}</b></td>
                  <td>{c.responsavel ?? <span className="muted">-</span>}</td>
                  <td>{c.email ?? <span className="muted">-</span>}</td>
                  <td>{c.celular ?? <span className="muted">-</span>}</td>
                  <td>{c._count.propostas}</td>
                  <td className="muted">{dataBR(c.criadoEm)}</td>
                </tr>
              ))}
              {contatos.length === 0 && <tr><td colSpan={6} className="vazio">Nenhum cliente cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Novo cliente</h2>
          <FormAcao acao={salvarContato} botao="Cadastrar cliente">
            <div className="campo"><label>Empresa do cliente</label><input name="organizacao" required /></div>
            <div className="campo"><label>Responsável</label><input name="responsavel" /></div>
            <div className="linha2">
              <div className="campo"><label>E-mail</label><input name="email" type="email" /></div>
              <div className="campo"><label>Celular</label><input name="celular" placeholder="(11) 91234-5678" /></div>
            </div>
          </FormAcao>
        </div>
      </div>
    </>
  );
}
