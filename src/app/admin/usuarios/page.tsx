import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { dataHoraBR } from "@/lib/formato";
import { lerPermissoes, PERFIS } from "@/lib/permissoes";

function perfilDe(u: { superAdmin: boolean; permissoes: unknown }) {
  if (u.superAdmin) return "Superadministrador";
  const p = JSON.stringify(lerPermissoes(u.permissoes));
  return PERFIS.find((x) => JSON.stringify(lerPermissoes(x.permissoes)) === p)?.nome ?? "Personalizado";
}

export default async function Usuarios() {
  const s = await exigirSessao("usuarios");
  const minhas = s.empresas.map((e) => e.id);
  // Lista quem atua em alguma das empresas que eu acesso (superadmin vê todos)
  const usuarios = await db.usuario.findMany({
    where: s.usuario.superAdmin ? {} : { OR: [{ todasEmpresas: true }, { membros: { some: { empresaId: { in: minhas } } } }] },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { membros: { include: { empresa: { select: { nome: true } } } } },
  });
  return (
    <>
      <div className="topo">
        <div><h1>Usuários</h1><p>Quem acessa o painel, em quais empresas e com quais permissões.</p></div>
        {s.permite("usuarios", "criar") && <Link className="btn destaque" href="/admin/usuarios/novo">+ Novo usuário</Link>}
      </div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Empresas</th><th>Último acesso</th><th>Status</th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.55 }}>
                <td><Link href={`/admin/usuarios/${u.id}`}>{u.nome}</Link></td>
                <td className="muted">{u.email}</td>
                <td>{perfilDe(u)}</td>
                <td className="muted" style={{ fontSize: 13 }}>{u.superAdmin || u.todasEmpresas ? "Todas" : u.membros.map((m) => m.empresa.nome).join(", ")}</td>
                <td className="muted">{dataHoraBR(u.ultimoAcesso)}</td>
                <td><span className={`status ${u.ativo ? "ACEITA" : "EXPIRADA"}`}>{u.ativo ? (u.bloqueadoAte && u.bloqueadoAte > new Date() ? "Bloqueado" : "Ativo") : "Inativo"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
