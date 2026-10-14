import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { brl } from "@/lib/formato";
import { FormAcao } from "@/components/admin/FormAcao";
import { alternarProduto, salvarProduto } from "../cadastros";

export default async function Catalogo() {
  const { empresa } = await exigirSessao();
  const produtos = await db.produto.findMany({ where: { empresaId: empresa.id }, orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { nome: "asc" }] });
  return (
    <>
      <div className="topo"><div><h1>Produtos e planos</h1><p>Itens que os modelos usam nos campos de produto (ex.: planos de servidor). A categoria liga o item ao campo do modelo.</p></div></div>
      <div className="grade g2">
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Produto</th><th>Categoria</th><th>Código</th><th>Preço</th><th>Atributos</th><th></th></tr></thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} style={{ opacity: p.ativo ? 1 : 0.5 }}>
                  <td><b>{p.nome}</b><br /><span className="muted" style={{ fontSize: 12.5 }}>{p.descricao}</span></td>
                  <td><span className="chip">{p.categoria}</span></td>
                  <td className="mono muted">{p.codigo}</td>
                  <td className="mono">{brl(Number(p.preco))}<span className="muted" style={{ fontSize: 12 }}>{p.recorrencia === "MENSAL" ? "/mês" : " único"}</span></td>
                  <td className="mono muted" style={{ fontSize: 12 }}>{Object.entries((p.atributos ?? {}) as object).map(([k, v]) => `${k}=${v}`).join(" · ")}</td>
                  <td><form action={alternarProduto.bind(null, p.id)}><button className="btn claro pequeno">{p.ativo ? "Desativar" : "Ativar"}</button></form></td>
                </tr>
              ))}
              {produtos.length === 0 && <tr><td colSpan={6} className="vazio">Nenhum produto cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Novo produto</h2>
          <FormAcao acao={salvarProduto} botao="Cadastrar produto">
            <div className="campo"><label>Nome</label><input name="nome" required /></div>
            <div className="linha2">
              <div className="campo"><label>Categoria</label><input name="categoria" placeholder="planos-nuvem" required /></div>
              <div className="campo"><label>Código</label><input name="codigo" placeholder="avancado" /></div>
            </div>
            <div className="linha2">
              <div className="campo"><label>Preço (R$)</label><input name="preco" type="number" step="0.01" min="0" required /></div>
              <div className="campo"><label>Cobrança</label><select name="recorrencia"><option value="MENSAL">Mensal</option><option value="UNICO">Única</option></select></div>
            </div>
            <div className="campo"><label>Descrição curta</label><input name="descricao" placeholder="16 vCPUs, 92 GB RAM, 1000 GB" /></div>
            <div className="campo">
              <label>Atributos técnicos</label>
              <input name="atributos" placeholder="vcpu=16; ram=92; disco=1000" />
              <div className="ajuda">Usados nos textos da proposta, ex.: {"{{plano.vcpu}}"} vCPUs.</div>
            </div>
          </FormAcao>
        </div>
      </div>
    </>
  );
}
