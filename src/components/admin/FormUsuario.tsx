"use client";

import { useState } from "react";
import { MODULOS, NOMES_ACOES, PERFIS, type Acao, type Modulo, type Permissoes } from "@/lib/permissoes";
import { redefinirSenha, salvarUsuario, type DadosUsuario } from "@/app/admin/usuarios/acoes";

type Props = {
  inicial: DadosUsuario;
  empresas: { id: string; nome: string }[];
  euSuper: boolean;
  euTodas: boolean;
};

export function FormUsuario({ inicial, empresas, euSuper, euTodas }: Props) {
  const [u, setU] = useState<DadosUsuario>(inicial);
  const [msg, setMsg] = useState<{ ok?: string; erro?: string; senha?: string }>({});
  const [salvando, setSalvando] = useState(false);
  const set = (p: Partial<DadosUsuario>) => setU((x) => ({ ...x, ...p }));
  const marcado = (m: Modulo, a: Acao) => !!u.permissoes.modulos[m]?.[a];
  const alternar = (m: Modulo, a: Acao) => {
    const atual = { ...(u.permissoes.modulos[m] ?? {}) };
    atual[a] = !atual[a];
    if (a === "ver" && !atual.ver) for (const k of Object.keys(atual)) atual[k as Acao] = false;
    if (a !== "ver" && atual[a]) atual.ver = true;
    set({ permissoes: { ...u.permissoes, modulos: { ...u.permissoes.modulos, [m]: atual } } });
  };

  async function salvar() {
    setSalvando(true);
    setMsg({});
    const r = await salvarUsuario(u);
    setSalvando(false);
    if ("erro" in r) return setMsg({ erro: r.erro });
    setMsg({ ok: "Usuário salvo.", senha: r.senhaTemporaria });
    if (!u.id) { set({ id: r.id, senha: "" }); window.history.replaceState(null, "", `/admin/usuarios/${r.id}`); }
    else set({ senha: "" });
  }

  return (
    <div className="grade g2">
      <div className="card">
        <h2>Dados de acesso</h2>
        <div className="linha2">
          <div className="campo"><label>Nome</label><input value={u.nome} onChange={(e) => set({ nome: e.target.value })} /></div>
          <div className="campo"><label>E-mail (login)</label><input type="email" value={u.email} onChange={(e) => set({ email: e.target.value })} /></div>
        </div>
        <div className="linha2">
          <div className="campo"><label>WhatsApp (recebe avisos das suas propostas)</label><input value={u.whatsapp} placeholder="5511999998888" onChange={(e) => set({ whatsapp: e.target.value })} /></div>
          <div className="campo"><label>{u.id ? "Nova senha (opcional)" : "Senha (vazio = gerar provisória)"}</label><input type="password" autoComplete="new-password" value={u.senha ?? ""} onChange={(e) => set({ senha: e.target.value })} /><div className="ajuda">Mínimo 10 caracteres, com letras e números. O usuário troca no primeiro acesso.</div></div>
        </div>
        <label className="check"><input type="checkbox" checked={u.ativo} onChange={(e) => set({ ativo: e.target.checked })} /> Usuário ativo</label>
        {euSuper && <label className="check"><input type="checkbox" checked={u.superAdmin} onChange={(e) => set({ superAdmin: e.target.checked })} /> Superadministrador (acesso total à plataforma)</label>}

        <h2 style={{ marginTop: 20 }}>Empresas</h2>
        {u.superAdmin ? (
          <p className="muted">Superadministrador acessa todas as empresas.</p>
        ) : (
          <>
            {(euSuper || euTodas) && <label className="check"><input type="checkbox" checked={u.todasEmpresas} onChange={(e) => set({ todasEmpresas: e.target.checked })} /> Acessa todas as empresas (inclusive as que forem criadas depois)</label>}
            {!u.todasEmpresas && empresas.map((e) => (
              <label key={e.id} className="check">
                <input type="checkbox" checked={u.empresas.includes(e.id)} onChange={() => set({ empresas: u.empresas.includes(e.id) ? u.empresas.filter((x) => x !== e.id) : [...u.empresas, e.id] })} /> {e.nome}
              </label>
            ))}
          </>
        )}
        {msg.erro && <div className="alerta erro">{msg.erro}</div>}
        {msg.ok && <div className="alerta ok">{msg.ok}{msg.senha && <> Senha provisória: <b className="mono">{msg.senha}</b> (anote e envie ao usuário; ele troca no primeiro acesso)</>}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn destaque" type="button" onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar usuário"}</button>
          {u.id && (
            <button className="btn claro" type="button" onClick={async () => {
              if (!confirm("Gerar uma nova senha provisória? O usuário será desconectado.")) return;
              const r = await redefinirSenha(u.id!);
              setMsg("erro" in r ? { erro: r.erro } : { ok: "Senha redefinida.", senha: r.senha });
            }}>Redefinir senha</button>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Permissões</h2>
        {u.superAdmin ? (
          <p className="muted">Superadministrador tem todas as permissões.</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>Aplicar perfil:</span>
              {PERFIS.map((p) => (
                <button key={p.id} type="button" className="btn claro pequeno" title={p.descricao} onClick={() => set({ permissoes: structuredClone(p.permissoes) as Permissoes })}>{p.nome}</button>
              ))}
            </div>
            <div className="tabela-wrap">
              <table className="tabela matriz">
                <thead><tr><th>Módulo</th>{(["ver", "criar", "editar", "excluir"] as Acao[]).map((a) => <th key={a}>{NOMES_ACOES[a]}</th>)}</tr></thead>
                <tbody>
                  {(Object.keys(MODULOS) as Modulo[]).map((m) => (
                    <tr key={m}>
                      <td><b>{MODULOS[m].nome}</b></td>
                      {(["ver", "criar", "editar", "excluir"] as Acao[]).map((a) => (
                        <td key={a}>{(MODULOS[m].acoes as readonly string[]).includes(a) ? <input type="checkbox" checked={marcado(m, a)} onChange={() => alternar(m, a)} aria-label={`${MODULOS[m].nome}: ${NOMES_ACOES[a]}`} /> : <span className="muted">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="check" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={!!u.permissoes.propostasDeTodos} onChange={(e) => set({ permissoes: { ...u.permissoes, propostasDeTodos: e.target.checked } })} />
              Vê as propostas de todos os usuários (desmarcado: só as próprias)
            </label>
            <p className="muted" style={{ fontSize: 12.5 }}>Você só consegue conceder permissões que você mesmo tem.</p>
          </>
        )}
      </div>
    </div>
  );
}
