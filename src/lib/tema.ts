// Identidade visual de cada empresa (Empresa.tema): somente cores e logos.
// Fontes e formato dos botões são padrão da plataforma, iguais para todas.

export type Tema = {
  /** Cor principal (fundos escuros, títulos). CADDI: azul-marinho */
  primaria: string;
  /** Variação da principal para degradês */
  primaria2: string;
  /** Cor de destaque (botões, números, detalhes). CADDI: dourado */
  destaque: string;
  /** Destaque bem claro (fundos suaves) */
  destaqueSuave: string;
  /** Destaque escuro para textos sobre fundo claro */
  destaqueTexto: string;
  /** Cinza de apoio */
  neutra: string;
  /** Fundo alternado das seções */
  tinta: string;
  /** Logo para fundos claros */
  logo: string;
  /** Logo para fundos escuros (opcional) */
  logoClaro?: string;
};

export const CORES_TEMA = ["primaria", "primaria2", "destaque", "destaqueSuave", "destaqueTexto", "neutra", "tinta"] as const;

export const TEMA_PADRAO: Tema = {
  primaria: "#0D1B3E",
  primaria2: "#16295A",
  destaque: "#C9A84C",
  destaqueSuave: "#FBF6E8",
  destaqueTexto: "#9A7F2F",
  neutra: "#B0B8C1",
  tinta: "#EEF2FA",
  logo: "",
};

/** Fontes padrão da plataforma (as mesmas para todas as empresas). */
export const FONTES = {
  titulo: "Space Grotesk",
  texto: "Inter",
  numeros: "JetBrains Mono",
  url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap",
};

const HEX = /^#[0-9a-f]{6}$/i;

export function temaDe(json: unknown): Tema {
  const t = { ...TEMA_PADRAO, ...((json as Partial<Tema>) ?? {}) };
  for (const k of CORES_TEMA) if (!HEX.test(t[k])) t[k] = TEMA_PADRAO[k];
  return t;
}

/** Variáveis CSS aplicadas no elemento raiz da proposta e do painel. */
export function variaveisCss(t: Tema): Record<string, string> {
  return {
    "--primary": t.primaria,
    "--primary-2": t.primaria2,
    "--accent": t.destaque,
    "--accent-soft": t.destaqueSuave,
    "--accent-ink": t.destaqueTexto,
    "--neutral": t.neutra,
    "--tint": t.tinta,
    "--font-title": `'${FONTES.titulo}', system-ui, sans-serif`,
    "--font-text": `'${FONTES.texto}', system-ui, sans-serif`,
    "--font-num": `'${FONTES.numeros}', ui-monospace, monospace`,
  };
}
