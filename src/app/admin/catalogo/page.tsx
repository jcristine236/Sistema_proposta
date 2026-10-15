import Link from "next/link";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { brl } from "@/lib/formato";
import { FormAcao } from "@/components/admin/FormAcao";
import { BotaoConfirmar } from "@/components/admin/Confirmar";
import { alternarProduto, excluirProduto, salvarProduto } from "../cadastros";

export default async function Catalogo({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const s = await exigirSessao("catalogo");
  const { editar } = await searchParams;
  const produtos = await db.produto.findMany({ where: { empresaId: s.empresa.id }, orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { nome: "asc" }] });
  const atual = editar ? produtos.find((p) => p.id === editar) : undefined;
  const podeForm = atual ? s.permite("catalogo", "editar") : s.permite("catalogo", "criar");
  const attrs = (p?: (typeof produtos)[number]) => Object.entries((p?.atributos ?? {}) as object).map(([k, v]) => `${k}=${v}`).join("; ");
  return (
    <>
      <div className="topo"><div><h1>Produtos e planos</h1><p>Itens usados nos campos de produto dos modelos (ex.: planos). A categoria liga o item ao campo do modelo.</p></div></div>
      <div className="grade g2">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Produto</th><th>Categoria</th><th>Código</th><th>Preço</th><th style={{ textAlign: "right" }}>Ações</th></tr></thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} style={{ opacity: p.ativo ? 1 : 0.5, background: p.id === editar ? "var(--accent-soft)" : undefined }}>
                  <td><b>{p.nome}</b><br /><span className="muted" style={{ fontSize: 12.5 }}>{p.descricao}</span>{attrs(p) && <div className="mono muted" style={{ fontSize: 11.5 }}>{attrs(p)}</div>}</td>
                  <td><span className="chip">{p.categoria}</span></td>
                  <td className="mono muted">{p.codigo}</td>
                  <td className="mono">{brl(Number(p.preco))}<span className="muted" style={{ fontSize: 12 }}>{p.recorrencia === "MENSAL" ? "/mês" : " único"}</span></td>
                  <td>
                    <div className="acoes-linha">
                      {s.permite("catalogo", "editar") && <Link className="btn claro pequeno" href={`/admin/catalogo?editar=${p.id}`}>Editar</Link>}
                      {s.permite("catalogo", "editar") && <form action={alternarProduto.bind(null, p.id)}><button className="btn claro pequeno">{p.ativo ? "Desativar" : "Ativar"}</button></form>}
                      {s.permite("catalogo", "excluir") && <form action={excluirProduto.bind(null, p.id)}><BotaoConfirmar mensagem={`Excluir "${p.nome}"? Propostas já enviadas não mudam.`}>Excluir</BotaoConfirmar></form>}
                    </div>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && <tr><td colSpan={5} className="vazio">Nenhum produto cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
        {podeForm && (
          <div className="card">
            <h2>{atual ? `Editar ${atual.nome}` : "Novo produto"}</h2>
            <FormAcao key={atual?.id ?? "novo"} acao={salvarProduto} botao={atual ? "Salvar alterações" : "Cadastrar produto"} cancelar={atual && <Link href="/admin/catalogo" className="muted">Cancelar</Link>}>
              {atual && <input type="hidden" name="id" value={atual.id} />}
              <div className="campo"><label>Nome</label><input name="nome" defaultValue={atual?.nome} required /></div>
              <div className="linha2">
                <div className="campo"><label>Categoria</label><input name="categoria" defaultValue={atual?.categoria} placeholder="planos-nuvem" required /></div>
                <div className="campo"><label>Código</label><input name="codigo" defaultValue={atual?.codigo ?? ""} placeholder="avancado" /></div>
              </div>
              <div className="linha2">
                <div className="campo"><label>Preço (R$)</label><input name="preco" type="number" step="0.01" min="0" defaultValue={atual ? Number(atual.preco) : undefined} required /></div>
                <div className="campo"><label>Cobrança</label><select name="recorrencia" defaultValue={atual?.recorrencia ?? "MENSAL"}><option value="MENSAL">Mensal</option><option value="UNICO">Única</option></select></div>
              </div>
              <div className="linha2">
                <div className="campo"><label>Descrição curta</label><input name="descricao" defaultValue={atual?.descricao ?? ""} /></div>
                <div className="campo"><label>Ordem</label><input name="ordem" type="number" defaultValue={atual?.ordem ?? 0} /></div>
              </div>
              <div className="campo">
                <label>Atributos técnicos</label>
                <input name="atributos" defaultValue={attrs(atual)} placeholder="vcpu=16; ram=92; disco=1000" />
                <div className="ajuda">Usados nos textos da proposta, ex.: {"{{plano.vcpu}}"} vCPUs.</div>
              </div>
            </FormAcao>
          </div>
        )}
      </div>
    </>
  );
}
