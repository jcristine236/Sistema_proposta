"use client";

// Editor visual de modelos (e de seções avulsas): arraste blocos da paleta para a
// área central, reordene arrastando, edite as propriedades à direita e veja a
// prévia completa. Tudo é salvo como JSON validado no servidor.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BLOCO, BLOCOS, EFEITOS, FUNDOS, novoId } from "@/lib/blocos";
import { valoresPadrao, type Campo } from "@/lib/campos";
import { montarContexto, type EmpresaPublica } from "@/lib/contexto";
import type { Precificacao, ProdutoCatalogo } from "@/lib/precificacao";
import type { Secao } from "@/lib/secoes";
import { variaveisCss, type Tema } from "@/lib/tema";
import { COMPONENTES } from "@/components/proposta/Secoes";
import { PropostaView } from "@/components/proposta/PropostaView";
import { Icone } from "@/components/proposta/icones";
import { CamposBloco } from "./CamposBloco";
import { EditorCalculo, EditorCampos } from "./EditorFormulario";
import { salvarModeloEditor, salvarSecaoFavorita } from "@/app/admin/modelos/acoes";

export type DadosModelo = {
  id?: string;
  nome: string;
  descricao: string;
  tipoSolucao: string;
  validadeDias: number;
  campos: Campo[];
  secoes: Secao[];
  precificacao: Precificacao;
};

type Favorita = { id: string; nome: string; secao: Secao };

type Props = {
  modo: "modelo" | "secao";
  inicial: DadosModelo;
  favoritas: Favorita[];
  catalogo: ProdutoCatalogo[];
  empresa: EmpresaPublica;
  tema: Tema;
  podeEditar: boolean;
  /** Para modo "secao": id da SecaoModelo em edição */
  secaoModeloId?: string;
};

type Arraste = { tipo: "novo"; bloco: string } | { tipo: "fav"; id: string } | { tipo: "mover"; de: number };
type Aba = "secoes" | "formulario" | "calculo" | "previa";

const CATEGORIAS = ["Estrutura", "Conteúdo", "Mídia", "Comercial", "Credibilidade"] as const;

export function EditorModelo({ modo, inicial, favoritas: favIniciais, catalogo, empresa, tema, podeEditar, secaoModeloId }: Props) {
  const router = useRouter();
  const [m, setM] = useState<DadosModelo>(inicial);
  const [sel, setSel] = useState<number | null>(inicial.secoes.length ? 0 : null);
  const [aba, setAba] = useState<Aba>("secoes");
  const [abaProp, setAbaProp] = useState<"conteudo" | "aparencia">("conteudo");
  const [alvo, setAlvo] = useState<number | null>(null);
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; erro?: string }>({});
  const [favoritas, setFavoritas] = useState(favIniciais);
  const [nomeSecao, setNomeSecao] = useState(inicial.nome);
  const arraste = useRef<Arraste | null>(null);

  const atualizar = (patch: Partial<DadosModelo>) => {
    setM((x) => ({ ...x, ...patch }));
    setAlterado(true);
    setMsg({});
  };
  const setSecoes = (secoes: Secao[]) => atualizar({ secoes });

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => { if (alterado) e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const ctx = useMemo(() => {
    const dados = valoresPadrao(m.campos);
    const cli = m.campos.find((c) => c.tipo === "contato");
    if (cli) dados[cli.id] = { nome: "Cliente Exemplo" };
    return montarContexto({ campos: m.campos, precificacao: m.precificacao, dados, catalogo, empresa });
  }, [m.campos, m.precificacao, catalogo, empresa]);

  // ---- inserir / mover --------------------------------------------------
  const inserir = (s: Secao, pos: number) => {
    if (modo === "secao") {
      setSecoes([s]);
      setSel(0);
      return;
    }
    const l = [...m.secoes];
    l.splice(pos, 0, s);
    setSecoes(l);
    setSel(pos);
  };
  const deBloco = (tipo: string): Secao => ({ ...(BLOCO[tipo].padrao() as Secao), id: novoId(tipo) }) as Secao;
  const deFavorita = (id: string): Secao | null => {
    const f = favoritas.find((x) => x.id === id);
    return f ? ({ ...structuredClone(f.secao), id: novoId(f.secao.tipo) } as Secao) : null;
  };
  const posPadrao = () => (sel === null ? m.secoes.length : sel + 1);

  const soltar = (pos: number) => {
    const a = arraste.current;
    arraste.current = null;
    setAlvo(null);
    if (!a || !podeEditar) return;
    if (a.tipo === "novo") inserir(deBloco(a.bloco), pos);
    else if (a.tipo === "fav") { const s = deFavorita(a.id); if (s) inserir(s, pos); }
    else {
      const l = [...m.secoes];
      const [item] = l.splice(a.de, 1);
      const destino = a.de < pos ? pos - 1 : pos;
      l.splice(destino, 0, item);
      setSecoes(l);
      setSel(destino);
    }
  };
  const sobre = (e: DragEvent, i: number) => {
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAlvo(e.clientY < r.top + r.height / 2 ? i : i + 1);
  };

  const atual = sel !== null ? m.secoes[sel] : null;
  const setAtual = (s: Secao) => sel !== null && setSecoes(m.secoes.map((x, j) => (j === sel ? s : x)));

  // ---- salvar -----------------------------------------------------------
  async function salvar() {
    setSalvando(true);
    setMsg({});
    if (modo === "secao") {
      if (!m.secoes[0]) { setSalvando(false); return setMsg({ erro: "Adicione um bloco." }); }
      const r = await salvarSecaoFavorita({ id: secaoModeloId, nome: nomeSecao, secao: m.secoes[0] });
      setSalvando(false);
      if ("erro" in r) return setMsg({ erro: r.erro });
      setAlterado(false);
      setMsg({ ok: "Seção salva." });
      if (!secaoModeloId) router.replace(`/admin/modelos/secoes/${r.id}`);
      return;
    }
    const r = await salvarModeloEditor(m);
    setSalvando(false);
    if ("erro" in r) return setMsg({ erro: r.erro });
    setAlterado(false);
    setMsg({ ok: "Modelo salvo." });
    if (!m.id) { setM((x) => ({ ...x, id: r.id })); router.replace(`/admin/modelos/${r.id}/editar`); }
  }

  async function favoritar(s: Secao) {
    const nome = window.prompt("Nome da seção favorita:", BLOCO[s.tipo]?.nome + (("titulo" in s && s.titulo) ? ` — ${String(s.titulo).slice(0, 40)}` : ""));
    if (!nome) return;
    const r = await salvarSecaoFavorita({ nome, secao: s });
    if ("erro" in r) return setMsg({ erro: r.erro });
    setFavoritas((f) => [...f, { id: r.id, nome, secao: s }]);
    setMsg({ ok: `“${nome}” salva em Minhas seções.` });
  }

  const vars = variaveisCss(tema) as CSSProperties;
  const variaveis = [
    "{{cliente}}", "{{validade}}", "{{empresa.nome}}",
    ...m.campos.filter((c) => c.tipo !== "contato" && c.tipo !== "lista").flatMap((c) =>
      c.tipo === "produto" ? [`{{${c.id}.nome}}`, `{{${c.id}.preco|brl}}`, ...(c.personalizado?.atributos ?? []).map((a) => `{{${c.id}.${a.id}}}`)] : [`{{${c.id}}}`]),
    "{{calc.totalMensal|brl}}", "{{calc.totalUnico|brl}}", "{{calc.subtotal|brl}}",
  ];

  return (
    <div className="editor">
      <div className="ed-topo">
        <div className="ed-topo-info">
          <Link href={modo === "secao" ? "/admin/modelos?aba=secoes" : "/admin/modelos"} className="muted">← Modelos</Link>
          {modo === "modelo" ? (
            <input className="ed-nome" value={m.nome} onChange={(e) => atualizar({ nome: e.target.value })} placeholder="Nome do modelo" disabled={!podeEditar} />
          ) : (
            <input className="ed-nome" value={nomeSecao} onChange={(e) => { setNomeSecao(e.target.value); setAlterado(true); }} placeholder="Nome da seção" disabled={!podeEditar} />
          )}
          {alterado && <span className="chip">não salvo</span>}
        </div>
        {modo === "modelo" && (
          <div className="abas">
            {([["secoes", "Seções"], ["formulario", "Formulário"], ["calculo", "Cálculo"], ["previa", "Prévia"]] as [Aba, string][]).map(([k, r]) => (
              <button key={k} type="button" className={aba === k ? "on" : ""} onClick={() => setAba(k)}>{r}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn claro"
            type="button"
            title="Baixar a definição do modelo (para backup ou para continuar com o Claude)"
            onClick={() => {
              const blob = new Blob([JSON.stringify(modo === "secao" ? { nome: nomeSecao, secao: m.secoes[0] } : m, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${(modo === "secao" ? nomeSecao : m.nome).replace(/[^\w-]+/g, "-").toLowerCase() || "modelo"}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Exportar JSON
          </button>
          {podeEditar && <button className="btn destaque" type="button" onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>}
        </div>
      </div>
      {msg.erro && <div className="alerta erro">{msg.erro}</div>}
      {msg.ok && <div className="alerta ok">{msg.ok}</div>}

      {aba === "formulario" && <EditorCampos campos={m.campos} onChange={(campos) => atualizar({ campos })} />}
      {aba === "calculo" && <EditorCalculo campos={m.campos} prec={m.precificacao} onChange={(precificacao) => atualizar({ precificacao })} />}
      {aba === "previa" && (
        <div className="previa-moldura">
          <PropostaView secoes={m.secoes} ctx={ctx} tema={tema} modo="previa" avisoPrevia="Prévia do modelo com valores de exemplo" />
        </div>
      )}

      {aba === "secoes" && (
        <div className="ed-grade">
          {/* Paleta */}
          <aside className="ed-paleta">
            {modo === "modelo" && (
              <div className="card ed-config">
                <div className="campo"><label>Descrição</label><input value={m.descricao} onChange={(e) => atualizar({ descricao: e.target.value })} /></div>
                <div className="campo"><label>Tipo de solução</label><input value={m.tipoSolucao} onChange={(e) => atualizar({ tipoSolucao: e.target.value })} /></div>
              </div>
            )}
            <div className="ed-titulo-paleta">Blocos <span className="muted">· arraste ou clique</span></div>
            {CATEGORIAS.map((cat) => (
              <div key={cat} className="ed-cat">
                <div className="ed-cat-nome">{cat}</div>
                {BLOCOS.filter((b) => b.categoria === cat).map((b) => (
                  <div
                    key={b.tipo}
                    className="ed-bloco-paleta"
                    draggable={podeEditar}
                    onDragStart={() => { arraste.current = { tipo: "novo", bloco: b.tipo }; }}
                    onClick={() => podeEditar && inserir(deBloco(b.tipo), posPadrao())}
                    title={b.descricao}
                  >
                    <Icone nome={b.icone} className="ic ed-ic" /> {b.nome}
                  </div>
                ))}
              </div>
            ))}
            <div className="ed-cat">
              <div className="ed-cat-nome">Minhas seções</div>
              {favoritas.length === 0 && <div className="muted" style={{ fontSize: 12.5, padding: "4px 2px" }}>Use ★ numa seção para salvá-la aqui.</div>}
              {favoritas.map((f) => (
                <div
                  key={f.id}
                  className="ed-bloco-paleta fav"
                  draggable={podeEditar}
                  onDragStart={() => { arraste.current = { tipo: "fav", id: f.id }; }}
                  onClick={() => { const s = deFavorita(f.id); if (s && podeEditar) inserir(s, posPadrao()); }}
                >
                  ★ {f.nome}
                </div>
              ))}
            </div>
          </aside>

          {/* Área de montagem */}
          <section className="ed-canvas" onDragOver={(e) => { e.preventDefault(); if (!m.secoes.length) setAlvo(0); }} onDrop={() => soltar(alvo ?? m.secoes.length)} onDragLeave={(e) => { if (e.currentTarget === e.target) setAlvo(null); }}>
            {m.secoes.length === 0 && <div className="ed-vazio">Arraste um bloco para cá{modo === "modelo" ? " (comece pela Capa)" : ""}.</div>}
            {m.secoes.map((s, i) => {
              const C = COMPONENTES[s.tipo];
              return (
                <div key={s.id} className="ed-wrap">
                  {alvo === i && <div className="ed-marca" />}
                  <div
                    className={`ed-bloco ${sel === i ? "sel" : ""}`}
                    onDragOver={(e) => sobre(e, i)}
                    onDrop={(e) => { e.stopPropagation(); soltar(alvo ?? i); }}
                    onClick={() => setSel(i)}
                  >
                    <div className="ed-barra" draggable={podeEditar && modo === "modelo"} onDragStart={() => { arraste.current = { tipo: "mover", de: i }; }}>
                      <span className="ed-alca" title="Arraste para mover">⋮⋮</span>
                      <b>{BLOCO[s.tipo]?.nome ?? s.tipo}</b>
                      {s.capitulo && <span className="muted">· {s.capitulo}</span>}
                      {podeEditar && (
                        <span className="ed-acoes" onClick={(e) => e.stopPropagation()}>
                          {modo === "modelo" && <button type="button" title="Subir" onClick={() => { if (i > 0) { const l = [...m.secoes]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; setSecoes(l); setSel(i - 1); } }}>↑</button>}
                          {modo === "modelo" && <button type="button" title="Descer" onClick={() => { if (i < m.secoes.length - 1) { const l = [...m.secoes]; [l[i + 1], l[i]] = [l[i], l[i + 1]]; setSecoes(l); setSel(i + 1); } }}>↓</button>}
                          {modo === "modelo" && <button type="button" title="Duplicar" onClick={() => inserir({ ...structuredClone(s), id: novoId(s.tipo) }, i + 1)}>⧉</button>}
                          {modo === "modelo" && <button type="button" title="Salvar como seção favorita" onClick={() => favoritar(s)}>★</button>}
                          <button type="button" title="Excluir" onClick={() => { setSecoes(m.secoes.filter((_, j) => j !== i)); setSel(null); }}>🗑</button>
                        </span>
                      )}
                    </div>
                    <div className="ed-render">
                      <div className="pp previa" style={vars}>
                        <C s={s as never} ctx={ctx} logo={s.tipo === "capa" ? tema.logoClaro || tema.logo : undefined} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {alvo === m.secoes.length && m.secoes.length > 0 && <div className="ed-marca" />}
          </section>

          {/* Propriedades */}
          <aside className="ed-props">
            {atual ? (
              <div className="card">
                <h2>{BLOCO[atual.tipo]?.nome}</h2>
                <div className="abas" style={{ marginBottom: 14 }}>
                  <button type="button" className={abaProp === "conteudo" ? "on" : ""} onClick={() => setAbaProp("conteudo")}>Conteúdo</button>
                  <button type="button" className={abaProp === "aparencia" ? "on" : ""} onClick={() => setAbaProp("aparencia")}>Aparência</button>
                </div>
                <fieldset disabled={!podeEditar} style={{ border: 0, padding: 0, margin: 0 }}>
                  {abaProp === "conteudo" ? (
                    <CamposBloco campos={BLOCO[atual.tipo]?.campos ?? []} valor={atual as unknown as Record<string, unknown>} camposForm={m.campos} onChange={(v) => setAtual(v as unknown as Secao)} />
                  ) : (
                    <>
                      <div className="campo"><label>Nome no menu de capítulos</label><input value={atual.capitulo ?? ""} onChange={(e) => setAtual({ ...atual, capitulo: e.target.value || undefined })} /><div className="ajuda">Também é o nome que aparece no tempo de leitura por seção.</div></div>
                      <div className="campo"><label>Número decorativo</label><input value={atual.numero ?? ""} placeholder="01" onChange={(e) => setAtual({ ...atual, numero: e.target.value || undefined })} /></div>
                      <div className="campo"><label>Fundo</label>
                        <select value={atual.fundo ?? "padrao"} onChange={(e) => setAtual({ ...atual, fundo: e.target.value as Secao["fundo"] })}>{FUNDOS.map((f) => <option key={f.v} value={f.v}>{f.r}</option>)}</select>
                      </div>
                      <div className="campo"><label>Efeito ao rolar</label>
                        <select value={atual.efeito ?? "padrao"} onChange={(e) => setAtual({ ...atual, efeito: e.target.value as Secao["efeito"] })}>{EFEITOS.map((f) => <option key={f.v} value={f.v}>{f.r}</option>)}</select>
                        <div className="ajuda">Veja o efeito na aba Prévia ou no link do cliente.</div>
                      </div>
                      <div className="campo"><label>Mostrar só se (avançado)</label><input value={atual.mostrarSe ?? ""} placeholder="ex.: observacoes" onChange={(e) => setAtual({ ...atual, mostrarSe: e.target.value || undefined })} /><div className="ajuda">Nome de um campo: a seção só aparece se ele estiver preenchido. Use ! para o contrário.</div></div>
                    </>
                  )}
                </fieldset>
              </div>
            ) : (
              <div className="card vazio">Clique numa seção para editar.</div>
            )}
            <div className="card">
              <h2>Variáveis</h2>
              <p className="muted" style={{ marginTop: -8, fontSize: 12.5 }}>Clique para copiar e cole nos textos. Viram os dados da proposta.</p>
              <div className="ed-vars">
                {variaveis.map((v) => <button key={v} type="button" className="chip mono" onClick={() => navigator.clipboard?.writeText(v)}>{v}</button>)}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
