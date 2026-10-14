// Identidade visual de cada empresa (Empresa.tema). Vira variáveis CSS na proposta
// pública e na cor de destaque do painel.

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
  fonteTitulo: string;
  fonteTexto: string;
  fonteNumeros: string;
  /** Logo para fundos claros */
  logo: string;
  /** Logo para fundos escuros (opcional) */
  logoClaro?: string;
};

export const TEMA_PADRAO: Tema = {
  primaria: "#0D1B3E",
  primaria2: "#16295A",
  destaque: "#C9A84C",
  destaqueSuave: "#FBF6E8",
  destaqueTexto: "#9A7F2F",
  neutra: "#B0B8C1",
  tinta: "#EEF2FA",
  fonteTitulo: "Space Grotesk",
  fonteTexto: "Inter",
  fonteNumeros: "JetBrains Mono",
  logo: "",
};

export function temaDe(json: unknown): Tema {
  return { ...TEMA_PADRAO, ...((json as Partial<Tema>) ?? {}) };
}

/** Variáveis CSS aplicadas no elemento raiz da proposta. */
export function variaveisCss(t: Tema): Record<string, string> {
  return {
    "--primary": t.primaria,
    "--primary-2": t.primaria2,
    "--accent": t.destaque,
    "--accent-soft": t.destaqueSuave,
    "--accent-ink": t.destaqueTexto,
    "--neutral": t.neutra,
    "--tint": t.tinta,
    "--font-title": `'${t.fonteTitulo}', system-ui, sans-serif`,
    "--font-text": `'${t.fonteTexto}', system-ui, sans-serif`,
    "--font-num": `'${t.fonteNumeros}', ui-monospace, monospace`,
  };
}

/** URL do Google Fonts com as três famílias do tema. */
export function urlFontes(t: Tema): string {
  const fam = (f: string, pesos: string) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@${pesos}`;
  return `https://fonts.googleapis.com/css2?${fam(t.fonteTitulo, "500;600;700;800")}&${fam(t.fonteTexto, "400;500;600;700")}&${fam(t.fonteNumeros, "500;600")}&display=swap`;
}
