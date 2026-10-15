"use client";

// Formulário de propriedades de um bloco, montado a partir de src/lib/blocos.ts.

import { useRef, useState } from "react";
import { escreverCaminho, lerCaminho, type CampoBloco } from "@/lib/blocos";
import type { Campo } from "@/lib/campos";
import { ICONES, Icone, NOMES_ICONES } from "@/components/proposta/icones";

type Props = {
  campos: CampoBloco[];
  valor: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  camposForm: Campo[];
};

export function CamposBloco({ campos, valor, onChange, camposForm }: Props) {
  return (
    <div className="ed-campos">
      {campos.map((c) => (
        <UmCampo key={c.k} c={c} valor={lerCaminho(valor, c.k)} camposForm={camposForm} onChange={(v) => onChange(escreverCaminho(valor, c.k, v))} />
      ))}
    </div>
  );
}

function UmCampo({ c, valor, onChange, camposForm }: { c: CampoBloco; valor: unknown; onChange: (v: unknown) => void; camposForm: Campo[] }) {
  const rotulo = <label>{c.rotulo}</label>;
  const ajuda = c.ajuda ? <div className="ajuda">{c.ajuda}</div> : null;
  switch (c.tipo) {
    case "texto":
      return <div className="campo">{rotulo}<input value={(valor as string) ?? ""} onChange={(e) => onChange(e.target.value)} />{ajuda}</div>;
    case "textoLongo":
      return <div className="campo">{rotulo}<textarea rows={3} value={(valor as string) ?? ""} onChange={(e) => onChange(e.target.value)} />{ajuda}</div>;
    case "paragrafos":
      return (
        <div className="campo">{rotulo}
          <textarea rows={6} value={((valor as string[]) ?? []).join("\n\n")} onChange={(e) => onChange(e.target.value.split(/\n\s*\n/))} />
          <div className="ajuda">Deixe uma linha em branco entre parágrafos. **negrito** e {"{{variáveis}}"} funcionam.</div>
        </div>
      );
    case "listaTexto":
      return (
        <div className="campo">{rotulo}
          <textarea rows={4} value={((valor as string[]) ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
          <div className="ajuda">Um item por linha.</div>
        </div>
      );
    case "numero":
      return <div className="campo">{rotulo}<input type="number" value={String(valor ?? "")} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />{ajuda}</div>;
    case "bool":
      return (
        <div className="campo">
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} /> {c.rotulo}
          </label>
        </div>
      );
    case "select":
      return (
        <div className="campo">{rotulo}
          <select value={(valor as string) ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
            {c.opcoes.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
          </select>{ajuda}
        </div>
      );
    case "campoForm":
      return (
        <div className="campo">{rotulo}
          <select value={(valor as string) ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
            <option value="">Nenhum</option>
            {camposForm.filter((f) => c.tiposCampo.includes(f.tipo)).map((f) => <option key={f.id} value={f.id}>{f.rotulo}</option>)}
          </select>{ajuda}
        </div>
      );
    case "icone":
      return <div className="campo">{rotulo}<SeletorIcone valor={(valor as string) ?? "check"} onChange={onChange} /></div>;
    case "imagem":
      return <div className="campo">{rotulo}<CampoImagem valor={(valor as string) ?? ""} onChange={onChange} /></div>;
    case "tabela":
      return <div className="campo">{rotulo}<EditorTabela valor={valor as { colunas: string[]; linhas: string[][] }} onChange={onChange} /></div>;
    case "lista":
      return <ListaItens c={c} valor={(valor as Record<string, unknown>[]) ?? []} onChange={onChange} camposForm={camposForm} />;
  }
}

function ListaItens({ c, valor, onChange, camposForm }: { c: Extract<CampoBloco, { tipo: "lista" }>; valor: unknown[]; onChange: (v: unknown) => void; camposForm: Campo[] }) {
  const [aberto, setAberto] = useState<number | null>(null);
  // Itens podem vir como texto simples (ex.: checks antigos): normaliza para objeto
  const itens = valor.map((v) => (typeof v === "string" ? { titulo: v } : (v as Record<string, unknown>)));
  const set = (l: Record<string, unknown>[]) => onChange(l);
  const mover = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= itens.length) return;
    const l = [...itens];
    [l[i], l[j]] = [l[j], l[i]];
    set(l);
    setAberto(j);
  };
  return (
    <div className="campo">
      <label>{c.rotulo} <span className="muted">({itens.length})</span></label>
      <div className="ed-lista">
        {itens.map((it, i) => (
          <div key={i} className={`ed-item ${aberto === i ? "aberto" : ""}`}>
            <div className="ed-item-topo" onClick={() => setAberto(aberto === i ? null : i)}>
              <span>{String((c.titulo && it[c.titulo]) || `Item ${i + 1}`).slice(0, 48)}</span>
              <span className="ed-item-acoes" onClick={(e) => e.stopPropagation()}>
                <button type="button" title="Subir" onClick={() => mover(i, -1)}>↑</button>
                <button type="button" title="Descer" onClick={() => mover(i, 1)}>↓</button>
                <button type="button" title="Duplicar" onClick={() => set([...itens.slice(0, i + 1), structuredClone(it), ...itens.slice(i + 1)])}>⧉</button>
                <button type="button" title="Remover" onClick={() => set(itens.filter((_, j) => j !== i))}>×</button>
              </span>
            </div>
            {aberto === i && (
              <div className="ed-item-corpo">
                <CamposBloco campos={c.itens} valor={it} camposForm={camposForm} onChange={(v) => set(itens.map((x, j) => (j === i ? v : x)))} />
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn claro pequeno" onClick={() => { set([...itens, structuredClone(c.novo)]); setAberto(itens.length); }}>+ Adicionar</button>
    </div>
  );
}

function SeletorIcone({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="btn claro pequeno" onClick={() => setAberto(!aberto)} style={{ gap: 8 }}>
        <Icone nome={valor} className="ic ed-ic" /> {valor}
      </button>
      {aberto && (
        <div className="ed-icones">
          {NOMES_ICONES.map((n) => (
            <button key={n} type="button" title={n} className={n === valor ? "on" : ""} onClick={() => { onChange(n); setAberto(false); }}>
              <svg className="ic ed-ic" viewBox="0 0 24 24">{ICONES[n]}</svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CampoImagem({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  async function enviar(f: File) {
    setErro("");
    if (f.size > 5 * 1024 * 1024) return setErro("Imagem maior que 5 MB.");
    setEnviando(true);
    const fd = new FormData();
    fd.append("arquivo", f);
    const r = await fetch("/api/uploads", { method: "POST", body: fd }).catch(() => null);
    setEnviando(false);
    const j = await r?.json().catch(() => null);
    if (!r?.ok) return setErro(j?.erro ?? "Falha no envio.");
    onChange(j.url);
  }
  return (
    <div>
      {valor && <img src={valor} alt="" className="ed-miniatura" />}
      <div style={{ display: "flex", gap: 6 }}>
        <input value={valor} placeholder="Envie um arquivo ou cole um link https://" onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn claro pequeno" disabled={enviando} onClick={() => input.current?.click()}>{enviando ? "Enviando..." : "Enviar"}</button>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
      <div className="ajuda">PNG, JPG, WebP ou GIF até 5 MB.</div>
      {erro && <div className="alerta erro">{erro}</div>}
    </div>
  );
}

function EditorTabela({ valor, onChange }: { valor?: { colunas: string[]; linhas: string[][] }; onChange: (v: unknown) => void }) {
  const t = { colunas: valor?.colunas ?? ["Coluna 1"], linhas: valor?.linhas ?? [[""]] };
  const set = (colunas: string[], linhas: string[][]) => onChange({ colunas, linhas });
  return (
    <div className="ed-tabela">
      <table>
        <thead>
          <tr>
            {t.colunas.map((c, j) => (
              <th key={j}>
                <input value={c} onChange={(e) => set(t.colunas.map((x, k) => (k === j ? e.target.value : x)), t.linhas)} />
                <button type="button" title="Remover coluna" onClick={() => set(t.colunas.filter((_, k) => k !== j), t.linhas.map((l) => l.filter((_, k) => k !== j)))}>×</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.linhas.map((l, i) => (
            <tr key={i}>
              {t.colunas.map((_, j) => (
                <td key={j}><textarea rows={1} value={l[j] ?? ""} onChange={(e) => set(t.colunas, t.linhas.map((x, k) => (k === i ? t.colunas.map((__, m) => (m === j ? e.target.value : x[m] ?? "")) : x)))} /></td>
              ))}
              <td className="ed-tab-acao"><button type="button" title="Remover linha" onClick={() => set(t.colunas, t.linhas.filter((_, k) => k !== i))}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button type="button" className="btn claro pequeno" onClick={() => set(t.colunas, [...t.linhas, t.colunas.map(() => "")])}>+ Linha</button>
        <button type="button" className="btn claro pequeno" onClick={() => set([...t.colunas, `Coluna ${t.colunas.length + 1}`], t.linhas.map((l) => [...l, ""]))}>+ Coluna</button>
      </div>
    </div>
  );
}
