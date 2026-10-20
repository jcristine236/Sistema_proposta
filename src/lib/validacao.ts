// Validação, no servidor, do que o editor de modelos envia. O conteúdo é JSON
// livre por bloco, então além do formato conferimos limites de tamanho,
// profundidade e os endereços de imagem/vídeo/link.

import { z } from "zod";
import { TIPOS_SECAO } from "./blocos";
import { TIPOS_CAMPO, type Campo } from "./campos";
import type { Precificacao } from "./precificacao";
import type { Secao } from "./secoes";
import { urlImagem, urlLink, urlVideo } from "./urls";

const MAX_TEXTO = 8000;
const MAX_JSON = 600_000; // ~600 KB por modelo

function conferirValores(v: unknown, prof = 0): string | null {
  if (prof > 8) return "Estrutura aninhada demais.";
  if (typeof v === "string") return v.length > MAX_TEXTO ? "Texto muito longo." : null;
  if (typeof v === "number") return Number.isFinite(v) ? null : "Número inválido.";
  if (typeof v === "boolean" || v === null || v === undefined) return null;
  if (Array.isArray(v)) {
    if (v.length > 200) return "Lista com itens demais.";
    for (const x of v) { const e = conferirValores(x, prof + 1); if (e) return e; }
    return null;
  }
  if (typeof v === "object") {
    const ent = Object.entries(v as object);
    if (ent.length > 60) return "Objeto com campos demais.";
    for (const [k, x] of ent) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") return "Campo inválido.";
      const e = conferirValores(x, prof + 1);
      if (e) return e;
    }
    return null;
  }
  return "Valor inválido.";
}

const Id = z.string().regex(/^[a-z][\w-]{0,60}$/i, "Identificador inválido");

const SecaoZ = z
  .object({
    id: Id,
    tipo: z.enum(TIPOS_SECAO as [string, ...string[]]),
    capitulo: z.string().max(80).optional(),
    numero: z.string().max(6).optional(),
    mostrarSe: z.string().max(60).regex(/^!?[\w.]*$/).optional(),
    fundo: z.enum(["padrao", "branco", "tinta", "escuro"]).optional(),
    efeito: z.enum(["padrao", "nenhum", "subir", "esquerda", "direita", "zoom", "desfocar"]).optional(),
  })
  .passthrough();

/** Confere endereços de mídia/links: se inválidos, são removidos (não bloqueia o salvamento). */
function limparUrls(s: Record<string, unknown>) {
  if (typeof s.imagem === "string" && s.imagem && !urlImagem(s.imagem)) s.imagem = "";
  if (typeof s.botaoUrl === "string" && s.botaoUrl && !urlLink(s.botaoUrl)) s.botaoUrl = "";
  if (s.tipo === "video" && typeof s.url === "string" && s.url && !urlVideo(s.url)) s.url = "";
  return s;
}

export function validarSecao(v: unknown): { ok: Secao } | { erro: string } {
  const r = SecaoZ.safeParse(v);
  if (!r.success) return { erro: `Seção inválida: ${r.error.issues[0]?.message}` };
  const e = conferirValores(r.data);
  if (e) return { erro: e };
  return { ok: limparUrls({ ...r.data }) as unknown as Secao };
}

export function validarSecoes(v: unknown): { ok: Secao[] } | { erro: string } {
  if (!Array.isArray(v) || v.length > 60) return { erro: "Lista de seções inválida." };
  const out: Secao[] = [];
  const ids = new Set<string>();
  for (const s of v) {
    const r = validarSecao(s);
    if ("erro" in r) return r;
    if (ids.has(r.ok.id)) r.ok.id = `${r.ok.tipo}-${Math.random().toString(36).slice(2, 8)}`;
    ids.add(r.ok.id);
    out.push(r.ok);
  }
  return { ok: out };
}

const CampoZ = z
  .object({
    id: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,39}$/, "A variável do campo deve começar com letra e ter só letras, números ou _"),
    tipo: z.enum(TIPOS_CAMPO.map((t) => t.tipo) as [string, ...string[]]),
    rotulo: z.string().min(1, "Todo campo precisa de rótulo").max(120),
  })
  .passthrough();

const RESERVADAS = new Set(["calc", "empresa", "validadeISO", "expirada"]);

export function validarCampos(v: unknown): { ok: Campo[] } | { erro: string } {
  if (!Array.isArray(v) || v.length > 60) return { erro: "Lista de campos inválida." };
  const ids = new Set<string>();
  for (const c of v) {
    const r = CampoZ.safeParse(c);
    if (!r.success) return { erro: r.error.issues[0]?.message ?? "Campo inválido." };
    if (ids.has(r.data.id)) return { erro: `Variável repetida: ${r.data.id}` };
    if (RESERVADAS.has(r.data.id)) return { erro: `“${r.data.id}” é um nome reservado. Escolha outra variável.` };
    ids.add(r.data.id);
  }
  const e = conferirValores(v);
  return e ? { erro: e } : { ok: v as Campo[] };
}

export function validarPrecificacao(v: unknown, campos: Campo[]): { ok: Precificacao } | { erro: string } {
  const e = conferirValores(v);
  if (e) return { erro: e };
  const p = (v ?? {}) as Precificacao;
  const existe = (id?: string) => !id || campos.some((c) => c.id === id);
  const limpo: Precificacao = {};
  if (p.recorrente?.base?.campo && existe(p.recorrente.base.campo)) {
    limpo.recorrente = {
      base: { campo: p.recorrente.base.campo },
      adicionais: (p.recorrente.adicionais ?? []).filter((a) => a.campo && existe(a.campo)).map((a) => ({
        campo: a.campo, inclusos: Number(a.inclusos) || 0, valorUnitario: Number(a.valorUnitario) || 0,
        rotuloSingular: String(a.rotuloSingular ?? ""), rotuloPlural: String(a.rotuloPlural ?? ""),
        rotuloLinha: String(a.rotuloLinha ?? ""), unidade: [String(a.unidade?.[0] ?? ""), String(a.unidade?.[1] ?? "")],
      })),
    };
    if (p.recorrente.extras?.campo && existe(p.recorrente.extras.campo)) limpo.recorrente.extras = { campo: p.recorrente.extras.campo };
  }
  if (p.desconto?.campo && existe(p.desconto.campo)) limpo.desconto = { campo: p.desconto.campo, limitePct: p.desconto.limitePct };
  limpo.unicos = (p.unicos ?? []).filter((u) => u.campo && existe(u.campo)).map((u) => ({ campo: u.campo, rotulo: String(u.rotulo ?? "") }));
  return { ok: limpo };
}

export function tamanhoOk(...v: unknown[]) {
  return JSON.stringify(v).length <= MAX_JSON;
}
