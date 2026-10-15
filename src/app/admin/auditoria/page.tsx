import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { dataHoraBR } from "@/lib/formato";

const ACOES: Record<string, string> = {
  LOGIN: "Entrou", LOGOUT: "Saiu", LOGIN_FALHOU: "Login incorreto", LOGIN_BLOQUEADO: "Bloqueado por tentativas",
  CRIAR: "Criou", EDITAR: "Editou", EXCLUIR: "Excluiu", ATIVAR: "Ativou", DESATIVAR: "Desativou",
  TROCAR_SENHA: "Trocou a senha", REDEFINIR_SENHA: "Redefiniu senha",
};

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ acao?: string }> }) {
  const s = await exigirSessao("auditoria");
  const { acao } = await searchParams;
  const ids = s.empresas.map((e) => e.id);
  const logs = await db.logAuditoria.findMany({
    where: {
      ...(s.usuario.superAdmin ? {} : { OR: [{ empresaId: { in: ids } }, { empresaId: null, usuario: { membros: { some: { empresaId: { in: ids } } } } }] }),
      ...(acao && acao in ACOES ? { acao } : {}),
    },
    orderBy: { criadoEm: "desc" },
    take: 300,
    include: { usuario: { select: { nome: true, email: true } } },
  });
  return (
    <>
      <div className="topo"><div><h1>Auditoria</h1><p>Últimos 300 registros de acesso e alterações.</p></div>
        <form style={{ display: "flex", gap: 6 }}>
          <select name="acao" defaultValue={acao ?? ""} className="input-inline"><option value="">Todas as ações</option>{Object.entries(ACOES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <button className="btn claro pequeno">Filtrar</button>
        </form>
      </div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>O quê</th><th>IP</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{dataHoraBR(l.criadoEm)}</td>
                <td>{l.usuario?.nome ?? <span className="muted">—</span>}</td>
                <td><span className={`status ${l.acao.startsWith("LOGIN_") || l.acao === "EXCLUIR" ? "RECUSADA" : ""}`}>{ACOES[l.acao] ?? l.acao}</span></td>
                <td style={{ fontSize: 13 }}>{l.entidade && <b>{l.entidade} </b>}{l.descricao}</td>
                <td className="mono muted" style={{ fontSize: 12 }}>{l.ip}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="vazio">Sem registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
