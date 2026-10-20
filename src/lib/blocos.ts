// Catálogo de blocos do editor de modelos: nome, categoria, campos editáveis e
// conteúdo inicial de cada tipo de seção. O editor (arrastar e soltar) monta o
// formulário de propriedades a partir destas definições.

import type { Efeito, Fundo, Secao, TipoSecao } from "./secoes";

export type CampoBloco =
  | { k: string; rotulo: string; tipo: "texto" | "textoLongo" | "paragrafos" | "icone" | "imagem" | "listaTexto" | "tabela"; ajuda?: string }
  | { k: string; rotulo: string; tipo: "numero"; ajuda?: string }
  | { k: string; rotulo: string; tipo: "bool"; ajuda?: string }
  | { k: string; rotulo: string; tipo: "select"; opcoes: { v: string; r: string }[]; ajuda?: string }
  | { k: string; rotulo: string; tipo: "campoForm"; tiposCampo: string[]; ajuda?: string }
  | { k: string; rotulo: string; tipo: "lista"; itens: CampoBloco[]; novo: Record<string, unknown>; titulo?: string; ajuda?: string };

export type DefBloco = {
  tipo: TipoSecao;
  nome: string;
  categoria: "Estrutura" | "Conteúdo" | "Mídia" | "Comercial" | "Credibilidade";
  descricao: string;
  icone: string;
  campos: CampoBloco[];
  padrao: () => Omit<Secao, "id">;
};

const card = (rot = "Cards"): CampoBloco => ({
  k: "cards", rotulo: rot, tipo: "lista", titulo: "titulo",
  novo: { icone: "check", titulo: "Novo item", texto: "Descrição" },
  itens: [{ k: "icone", rotulo: "Ícone", tipo: "icone" }, { k: "titulo", rotulo: "Título", tipo: "texto" }, { k: "texto", rotulo: "Texto", tipo: "textoLongo" }],
});
const itensIcone = (k: string, rot: string): CampoBloco => ({ ...card(rot), k } as CampoBloco);

export const BLOCOS: DefBloco[] = [
  {
    tipo: "capa", nome: "Capa", categoria: "Estrutura", icone: "home",
    descricao: "Abertura com logo, título, nome do cliente e selos.",
    campos: [
      { k: "eyebrow", rotulo: "Linha acima do título", tipo: "texto" },
      { k: "titulo", rotulo: "Título (Enter quebra a linha)", tipo: "textoLongo" },
      { k: "tagline", rotulo: "Frase ao lado do logo", tipo: "texto" },
      {
        k: "selos", rotulo: "Selos", tipo: "lista", titulo: "texto", novo: { icone: "check", texto: "Novo selo" },
        itens: [
          { k: "icone", rotulo: "Ícone", tipo: "icone" },
          { k: "texto", rotulo: "Texto", tipo: "texto" },
          { k: "estilo", rotulo: "Estilo", tipo: "select", opcoes: [{ v: "", r: "Neutro" }, { v: "destaque", r: "Destaque" }, { v: "validade", r: "Validade (fica vermelho se expirar)" }] },
        ],
      },
    ],
    padrao: () => ({ tipo: "capa", capitulo: "Início", eyebrow: "Proposta comercial", titulo: "Proposta\nComercial", selos: [{ icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" }] }),
  },
  {
    tipo: "titulo", nome: "Título", categoria: "Estrutura", icone: "flag",
    descricao: "Título de capítulo com subtítulo.",
    campos: [
      { k: "eyebrow", rotulo: "Linha acima", tipo: "texto" },
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "subtitulo", rotulo: "Subtítulo", tipo: "textoLongo" },
      { k: "alinhamento", rotulo: "Alinhamento", tipo: "select", opcoes: [{ v: "esquerda", r: "Esquerda" }, { v: "centro", r: "Centro" }] },
    ],
    padrao: () => ({ tipo: "titulo", titulo: "Novo capítulo", subtitulo: "Uma frase que resume este capítulo.", alinhamento: "esquerda" }),
  },
  {
    tipo: "texto", nome: "Texto", categoria: "Conteúdo", icone: "pen",
    descricao: "Título e parágrafos. Use **negrito** e {{variáveis}}.",
    campos: [
      { k: "eyebrow", rotulo: "Linha acima", tipo: "texto" },
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "paragrafos", rotulo: "Texto (linha em branco separa parágrafos)", tipo: "paragrafos" },
    ],
    padrao: () => ({ tipo: "texto", titulo: "Título da seção", paragrafos: ["Escreva aqui o conteúdo para **{{cliente}}**."] }),
  },
  {
    tipo: "imagemTexto", nome: "Imagem + texto", categoria: "Conteúdo", icone: "laptop",
    descricao: "Imagem de um lado e texto do outro (esquerda ou direita).",
    campos: [
      { k: "lado", rotulo: "Imagem à", tipo: "select", opcoes: [{ v: "direita", r: "Direita" }, { v: "esquerda", r: "Esquerda" }] },
      { k: "imagem", rotulo: "Imagem", tipo: "imagem" },
      { k: "eyebrow", rotulo: "Linha acima", tipo: "texto" },
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "paragrafos", rotulo: "Texto", tipo: "paragrafos" },
      { k: "botaoTexto", rotulo: "Botão (texto)", tipo: "texto" },
      { k: "botaoUrl", rotulo: "Botão (link)", tipo: "texto", ajuda: "https://..., mailto: ou tel:" },
    ],
    padrao: () => ({ tipo: "imagemTexto", lado: "direita", imagem: "", titulo: "Título ao lado da imagem", paragrafos: ["Texto explicativo."] }),
  },
  {
    tipo: "abertura", nome: "Cards com ícones", categoria: "Conteúdo", icone: "users",
    descricao: "Chamada, frase de impacto e cartões com ícone.",
    campos: [
      { k: "chamada", rotulo: "Chamada", tipo: "texto" },
      { k: "titulo", rotulo: "Frase principal", tipo: "textoLongo" },
      { k: "destaque", rotulo: "Trecho em destaque", tipo: "texto" },
      card(),
    ],
    padrao: () => ({ tipo: "abertura", chamada: "O que faremos por **{{cliente}}**", titulo: "Uma frase que resume a solução.", destaque: "Em destaque.", cards: [
      { icone: "cloud", titulo: "Benefício 1", texto: "Descrição curta" }, { icone: "users", titulo: "Benefício 2", texto: "Descrição curta" }, { icone: "headset", titulo: "Benefício 3", texto: "Descrição curta" }] }),
  },
  {
    tipo: "faq", nome: "Perguntas frequentes", categoria: "Conteúdo", icone: "headset",
    descricao: "Perguntas que abrem e fecham.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "itens", rotulo: "Perguntas", tipo: "lista", titulo: "pergunta", novo: { pergunta: "Nova pergunta?", resposta: "Resposta." },
        itens: [{ k: "pergunta", rotulo: "Pergunta", tipo: "texto" }, { k: "resposta", rotulo: "Resposta", tipo: "textoLongo" }] },
    ],
    padrao: () => ({ tipo: "faq", titulo: "Perguntas frequentes", itens: [{ pergunta: "Qual o prazo de implantação?", resposta: "Em média 15 dias." }] }),
  },
  {
    tipo: "imagem", nome: "Imagem", categoria: "Mídia", icone: "monitor",
    descricao: "Imagem grande com legenda.",
    campos: [
      { k: "titulo", rotulo: "Título (opcional)", tipo: "texto" },
      { k: "imagem", rotulo: "Imagem", tipo: "imagem" },
      { k: "legenda", rotulo: "Legenda", tipo: "texto" },
      { k: "largura", rotulo: "Largura", tipo: "select", opcoes: [{ v: "contida", r: "Na largura do texto" }, { v: "total", r: "Tela inteira" }] },
    ],
    padrao: () => ({ tipo: "imagem", imagem: "", largura: "contida" }),
  },
  {
    tipo: "video", nome: "Vídeo", categoria: "Mídia", icone: "rocket",
    descricao: "Vídeo do YouTube ou Vimeo.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "texto", rotulo: "Texto", tipo: "textoLongo" },
      { k: "url", rotulo: "Link do vídeo", tipo: "texto", ajuda: "Ex.: https://www.youtube.com/watch?v=..." },
    ],
    padrao: () => ({ tipo: "video", titulo: "Veja como funciona", url: "" }),
  },
  {
    tipo: "marcas", nome: "Faixa de marcas", categoria: "Credibilidade", icone: "globe",
    descricao: "Nomes de parceiros/clientes deslizando.",
    campos: [{ k: "titulo", rotulo: "Título", tipo: "texto" }, { k: "itens", rotulo: "Nomes", tipo: "listaTexto" }],
    padrao: () => ({ tipo: "marcas", titulo: "Quem confia na gente", itens: ["Parceiro 1", "Parceiro 2", "Parceiro 3", "Parceiro 4"] }),
  },
  {
    tipo: "sobre", nome: "Quem somos (números)", categoria: "Credibilidade", icone: "target",
    descricao: "Texto, números animados e valores com letras grandes.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "paragrafos", rotulo: "Texto", tipo: "paragrafos" },
      { k: "numeros", rotulo: "Números", tipo: "lista", titulo: "rotulo", novo: { valor: 100, sufixo: "+", rotulo: "clientes" },
        itens: [{ k: "valor", rotulo: "Valor", tipo: "numero" }, { k: "sufixo", rotulo: "Sufixo (+, h, %)", tipo: "texto" }, { k: "rotulo", rotulo: "Legenda", tipo: "texto" },
          { k: "formato", rotulo: "Formato", tipo: "select", opcoes: [{ v: "milhar", r: "1.000" }, { v: "simples", r: "1000 (ano)" }] }] },
      { k: "valoresTitulo", rotulo: "Título dos valores", tipo: "texto" },
      { k: "letras", rotulo: "Letras grandes (uma por valor)", tipo: "texto" },
      { k: "valores", rotulo: "Valores", tipo: "lista", titulo: "palavra", novo: { palavra: "Valor", texto: "Descrição" },
        itens: [{ k: "palavra", rotulo: "Palavra", tipo: "texto" }, { k: "texto", rotulo: "Texto", tipo: "textoLongo" }] },
    ],
    padrao: () => ({ tipo: "sobre", titulo: "Quem somos", paragrafos: ["Conte a história da empresa."], numeros: [{ valor: 10, sufixo: "+", rotulo: "anos de mercado" }, { valor: 500, sufixo: "+", rotulo: "clientes" }], valores: [] }),
  },
  {
    tipo: "confianca", nome: "Certificações", categoria: "Credibilidade", icone: "shield",
    descricao: "Texto e selos organizados em abas.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "paragrafos", rotulo: "Texto", tipo: "paragrafos" },
      { k: "ilustracao", rotulo: "Ilustração", tipo: "select", opcoes: [{ v: "", r: "Nenhuma" }, { v: "datacenter", r: "Data center" }] },
      { k: "grupos", rotulo: "Abas", tipo: "lista", titulo: "nome", novo: { nome: "Nova aba", selos: [] },
        itens: [{ k: "nome", rotulo: "Nome da aba", tipo: "texto" },
          { k: "selos", rotulo: "Selos", tipo: "lista", titulo: "codigo", novo: { sigla: "ISO", codigo: "9001", descricao: "Descrição" },
            itens: [{ k: "sigla", rotulo: "Sigla", tipo: "texto" }, { k: "codigo", rotulo: "Código", tipo: "texto" }, { k: "descricao", rotulo: "Descrição", tipo: "texto" }] }] },
    ],
    padrao: () => ({ tipo: "confianca", titulo: "Confiança", paragrafos: ["Texto sobre segurança e certificações."], grupos: [{ nome: "Qualidade", selos: [{ sigla: "ISO", codigo: "9001", descricao: "Gestão de qualidade" }] }] }),
  },
  {
    tipo: "comparativo", nome: "Diferenciais (nós x mercado)", categoria: "Credibilidade", icone: "bolt",
    descricao: "Comparação item a item.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "rotuloMercado", rotulo: "Rótulo da concorrência", tipo: "texto" },
      { k: "itens", rotulo: "Itens", tipo: "lista", titulo: "titulo", novo: { icone: "check", titulo: "Item", nosso: "Como fazemos", mercado: "Como o mercado faz" },
        itens: [{ k: "icone", rotulo: "Ícone", tipo: "icone" }, { k: "titulo", rotulo: "Título", tipo: "texto" }, { k: "nosso", rotulo: "Nós", tipo: "textoLongo" }, { k: "mercado", rotulo: "Mercado", tipo: "textoLongo" }] },
    ],
    padrao: () => ({ tipo: "comparativo", titulo: "Nossos diferenciais", rotuloMercado: "Mercado tradicional", itens: [{ icone: "headset", titulo: "Suporte", nosso: "Atendimento humano", mercado: "Robôs e filas" }] }),
  },
  {
    tipo: "tabela", nome: "Tabela", categoria: "Comercial", icone: "db",
    descricao: "Tabela livre com colunas e linhas.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "subtitulo", rotulo: "Subtítulo", tipo: "textoLongo" },
      { k: "tabela", rotulo: "Tabela", tipo: "tabela" },
      { k: "nota", rotulo: "Nota abaixo", tipo: "texto" },
    ],
    padrao: () => ({ tipo: "tabela", titulo: "Escopo", tabela: { colunas: ["Item", "Descrição", "Prazo"], linhas: [["Implantação", "Configuração inicial", "15 dias"]] } }),
  },
  {
    tipo: "campoLista", nome: "Lista preenchível", categoria: "Conteúdo", icone: "check",
    descricao: "Mostra, como lista de título + descrição, o conteúdo de um campo do tipo Lista (ex.: escopo, materiais) que o vendedor preenche na proposta.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "subtitulo", rotulo: "Subtítulo", tipo: "textoLongo" },
      { k: "campo", rotulo: "Campo de lista a exibir", tipo: "campoForm", tiposCampo: ["lista"], ajuda: "Escolha um campo do formulário do tipo Lista." },
      { k: "icone", rotulo: "Ícone de cada item", tipo: "icone" },
      { k: "nota", rotulo: "Nota abaixo", tipo: "texto" },
    ],
    padrao: () => ({ tipo: "campoLista", titulo: "Escopo", campo: "", icone: "check" }),
  },
  {
    tipo: "especificacoes", nome: "Especificações técnicas", categoria: "Comercial", icone: "server",
    descricao: "Tabela de duas colunas preenchida com os dados da proposta.",
    campos: [
      { k: "eyebrow", rotulo: "Linha acima", tipo: "texto" },
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "subtitulo", rotulo: "Subtítulo", tipo: "texto" },
      { k: "texto", rotulo: "Texto", tipo: "textoLongo" },
      { k: "tituloTabela", rotulo: "Título da tabela", tipo: "texto" },
      { k: "selo", rotulo: "Selo ao lado", tipo: "texto" },
      { k: "nota", rotulo: "Nota", tipo: "texto" },
      { k: "linhas", rotulo: "Linhas", tipo: "lista", titulo: "rotulo", novo: { rotulo: "Item", valor: "Valor" },
        itens: [{ k: "rotulo", rotulo: "Item", tipo: "texto" }, { k: "valor", rotulo: "Valor (aceita {{variáveis}})", tipo: "textoLongo" }] },
    ],
    padrao: () => ({ tipo: "especificacoes", titulo: "Especificações", tituloTabela: "Configuração", linhas: [{ rotulo: "Item", valor: "Valor" }] }),
  },
  {
    tipo: "planos", nome: "Planos (cards de preço)", categoria: "Comercial", icone: "money",
    descricao: "Cartões de planos; pode destacar o plano escolhido no formulário.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "subtitulo", rotulo: "Subtítulo", tipo: "textoLongo" },
      { k: "destacarCampo", rotulo: "Destacar o plano escolhido no campo", tipo: "campoForm", tiposCampo: ["produto"] },
      { k: "planos", rotulo: "Planos", tipo: "lista", titulo: "nome", novo: { nome: "Plano", preco: "R$ 0,00", periodo: "/mês", itens: ["Item incluso"] },
        itens: [{ k: "nome", rotulo: "Nome", tipo: "texto" }, { k: "preco", rotulo: "Preço", tipo: "texto" }, { k: "periodo", rotulo: "Período", tipo: "texto" },
          { k: "descricao", rotulo: "Descrição", tipo: "textoLongo" }, { k: "itens", rotulo: "Itens inclusos", tipo: "listaTexto" },
          { k: "destaque", rotulo: "Destacar", tipo: "bool" }, { k: "selo", rotulo: "Selo", tipo: "texto" },
          { k: "ancora", rotulo: "Botão: rolar até a seção (id)", tipo: "texto", ajuda: "Opcional. Id de uma seção desta proposta, ex.: investimento." },
          { k: "botao", rotulo: "Texto do botão", tipo: "texto" }] },
      { k: "nota", rotulo: "Nota", tipo: "texto" },
    ],
    padrao: () => ({ tipo: "planos", titulo: "Planos", planos: [
      { nome: "Essencial", preco: "R$ 990", periodo: "/mês", itens: ["Item 1", "Item 2"] },
      { nome: "Profissional", preco: "R$ 1.490", periodo: "/mês", itens: ["Tudo do Essencial", "Item 3"], destaque: true },
      { nome: "Avançado", preco: "R$ 1.990", periodo: "/mês", itens: ["Tudo do Profissional", "Item 4"] }] }),
  },
  {
    tipo: "investimento", nome: "Condições comerciais", categoria: "Comercial", icone: "money",
    descricao: "Mensalidade calculada, desconto, taxa única e observações.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "recorrente.titulo", rotulo: "Título do card mensal", tipo: "texto" },
      { k: "recorrente.rotuloTotal", rotulo: "Rótulo do total", tipo: "texto" },
      { k: "recorrente.rodapeTotal", rotulo: "Texto abaixo do total", tipo: "texto" },
      { k: "recorrente.aviso.titulo", rotulo: "Aviso (título)", tipo: "texto" },
      { k: "recorrente.aviso.texto", rotulo: "Aviso (texto)", tipo: "textoLongo" },
      { k: "unico.titulo", rotulo: "Título do card de valor único", tipo: "texto" },
      { k: "unico.intro", rotulo: "Introdução do valor único", tipo: "texto" },
      { k: "unico.rotulo", rotulo: "Rótulo do valor único", tipo: "texto" },
      itensIcone("unico.itens", "Itens do valor único"),
      { k: "observacoes.titulo", rotulo: "Título das observações", tipo: "texto" },
    ],
    padrao: () => ({ tipo: "investimento", capitulo: "Investimento", titulo: "Condições comerciais",
      recorrente: { titulo: "Investimento", rotuloTotal: "Investimento mensal", rodapeTotal: "por mês" },
      unico: { titulo: "Implantação", rotulo: "Investimento único", itens: [] }, observacoes: { titulo: "Observações" } }),
  },
  {
    tipo: "resultados", nome: "Resultados", categoria: "Comercial", icone: "target",
    descricao: "Blocos de entregas: lista, checks ou grade.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "blocos", rotulo: "Blocos", tipo: "lista", titulo: "titulo", novo: { estilo: "checks", titulo: "Novo bloco", itens: [] },
        itens: [{ k: "estilo", rotulo: "Estilo", tipo: "select", opcoes: [{ v: "checks", r: "Lista com check (textos)" }, { v: "lista", r: "Lista com ícones" }, { v: "grade", r: "Grade de ícones" }] },
          { k: "titulo", rotulo: "Título", tipo: "texto" },
          { k: "itens", rotulo: "Itens (com check: só texto; demais: ícone+título+texto)", tipo: "lista", titulo: "titulo", novo: { icone: "check", titulo: "Item", texto: "" },
            itens: [{ k: "icone", rotulo: "Ícone", tipo: "icone" }, { k: "titulo", rotulo: "Título/texto", tipo: "texto" }, { k: "texto", rotulo: "Descrição", tipo: "textoLongo" }] },
          { k: "nota", rotulo: "Nota", tipo: "textoLongo" }] },
    ],
    padrao: () => ({ tipo: "resultados", titulo: "O que você recebe", blocos: [{ estilo: "checks", titulo: "Incluso", itens: ["Item 1", "Item 2"] }] }),
  },
  {
    tipo: "cronograma", nome: "Cronograma", categoria: "Comercial", icone: "calendar",
    descricao: "Etapas numeradas com linha do tempo animada.",
    campos: [{ k: "titulo", rotulo: "Título", tipo: "texto" }, itensIcone("etapas", "Etapas")],
    padrao: () => ({ tipo: "cronograma", capitulo: "Cronograma", titulo: "Próximos passos", etapas: [
      { icone: "pen", titulo: "Aceite", texto: "Você aceita por aqui." }, { icone: "flag", titulo: "Início", texto: "Reunião de kickoff." }, { icone: "rocket", titulo: "Entrega", texto: "Projeto no ar." }] }),
  },
  {
    tipo: "fechamento", nome: "Fechamento (aceite)", categoria: "Estrutura", icone: "check",
    descricao: "Chamada final com botões de aceite, dúvida e recusa.",
    campos: [
      { k: "titulo", rotulo: "Título", tipo: "texto" },
      { k: "texto", rotulo: "Texto", tipo: "textoLongo" },
      { k: "botao", rotulo: "Texto do botão de aceite", tipo: "texto" },
      { k: "site", rotulo: "Site (rodapé)", tipo: "texto" },
    ],
    padrao: () => ({ tipo: "fechamento", capitulo: "Vamos começar?", titulo: "Vamos começar?", botao: "Quero seguir com esta proposta" }),
  },
];

export const BLOCO: Record<string, DefBloco> = Object.fromEntries(BLOCOS.map((b) => [b.tipo, b]));
export const TIPOS_SECAO = BLOCOS.map((b) => b.tipo);

/** Opções comuns a todas as seções (aba "Aparência" do editor). */
export const FUNDOS: { v: Fundo; r: string }[] = [
  { v: "padrao", r: "Padrão do bloco" },
  { v: "branco", r: "Branco" },
  { v: "tinta", r: "Suave (cor da marca)" },
  { v: "escuro", r: "Escuro (cor principal)" },
];
export const EFEITOS: { v: Efeito; r: string }[] = [
  { v: "padrao", r: "Padrão do bloco" },
  { v: "subir", r: "Surgir de baixo" },
  { v: "esquerda", r: "Deslizar da esquerda" },
  { v: "direita", r: "Deslizar da direita" },
  { v: "zoom", r: "Zoom" },
  { v: "desfocar", r: "Desfocar → nítido" },
  { v: "nenhum", r: "Sem efeito" },
];

export function novoId(tipo: string) {
  return `${tipo}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Lê/escreve valores com caminho "a.b.c" */
export function lerCaminho(obj: unknown, k: string): unknown {
  return k.split(".").reduce<unknown>((o, p) => (o && typeof o === "object" ? (o as Record<string, unknown>)[p] : undefined), obj);
}
export function escreverCaminho<T extends object>(obj: T, k: string, v: unknown): T {
  const partes = k.split(".");
  const raiz: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  let atual = raiz;
  partes.forEach((p, i) => {
    if (i === partes.length - 1) atual[p] = v;
    else {
      const prox = { ...((atual[p] as Record<string, unknown>) ?? {}) };
      atual[p] = prox;
      atual = prox;
    }
  });
  return raiz as T;
}
