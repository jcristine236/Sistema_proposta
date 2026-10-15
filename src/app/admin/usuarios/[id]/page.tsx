import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { lerPermissoes, PERFIS } from "@/lib/permissoes";
import { FormUsuario } from "@/components/admin/FormUsuario";
import { BotaoConfirmar } from "@/components/admin/Confirmar";
import { excluirUsuario } from "../acoes";

export default async function Usuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const novo = id === "novo";
  const s = await exigirSessao("usuarios", novo ? "criar" : "ver");
  const u = novo ? null : await db.usuario.findUnique({ where: { id }, include: { membros: true } });
  if (!novo && !u) notFound();
  const todas = await db.empresa.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } });
  const visiveis = s.usuario.superAdmin ? todas : todas.filter((e) => s.empresas.some((x) => x.id === e.id));
  const vendedor = PERFIS.find((p) => p.id === "vendedor")!.permissoes;
  return (
    <>
      <div className="topo">
        <div><Link href="/admin/usuarios" className="muted">← Usuários</Link><h1 style={{ marginTop: 6 }}>{novo ? "Novo usuário" : u!.nome}</h1></div>
        {!novo && s.permite("usuarios", "excluir") && u!.id !== s.usuario.id && (
          <form action={excluirUsuario.bind(null, u!.id)}>
            <BotaoConfirmar className="btn claro" mensagem="Excluir este usuário? Se ele tiver propostas, será apenas desativado para manter o histórico.">Excluir</BotaoConfirmar>
          </form>
        )}
      </div>
      <FormUsuario
        euSuper={s.usuario.superAdmin}
        euTodas={s.usuario.todasEmpresas}
        empresas={visiveis}
        inicial={u ? {
          id: u.id, nome: u.nome, email: u.email, whatsapp: u.whatsapp ?? "", ativo: u.ativo, superAdmin: u.superAdmin,
          todasEmpresas: u.todasEmpresas, empresas: u.membros.map((m) => m.empresaId), permissoes: lerPermissoes(u.permissoes),
        } : { nome: "", email: "", whatsapp: "", ativo: true, superAdmin: false, todasEmpresas: false, empresas: [s.empresa.id], permissoes: structuredClone(vendedor) }}
      />
    </>
  );
}
