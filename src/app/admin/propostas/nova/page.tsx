import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";

export default async function EscolherModelo() {
  const { empresa } = await exigirSessao("propostas", "criar");
  const modelos = await db.modelo.findMany({ where: { empresaId: empresa.id, ativo: true }, orderBy: { nome: "asc" } });
  if (modelos.length === 1) redirect(`/admin/propostas/nova/${modelos[0].id}`);
  return (
    <>
      <div className="topo"><div><h1>Nova proposta</h1><p>Escolha o tipo de solução. Cada modelo tem seu próprio formulário e visual.</p></div></div>
      <div className="grade g3">
        {modelos.map((m) => (
          <Link key={m.id} href={`/admin/propostas/nova/${m.id}`} className="card" style={{ textDecoration: "none" }}>
            <span className="chip">{m.tipoSolucao}</span>
            <h2 style={{ margin: "10px 0 6px" }}>{m.nome}</h2>
            <p className="muted" style={{ margin: 0 }}>{m.descricao}</p>
          </Link>
        ))}
        {modelos.length === 0 && <div className="card vazio">Nenhum modelo ativo. Crie um em Modelos.</div>}
      </div>
    </>
  );
}
