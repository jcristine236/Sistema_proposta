// Tipos de seção (blocos) que compõem uma proposta. Cada Modelo guarda uma lista
// ordenada destas seções em Modelo.secoes. Todos os textos aceitam {{variáveis}}
// (ver src/lib/contexto.ts) e **negrito**.

type Icone = string; // nome de um ícone de src/components/proposta/icones.tsx
type CardIcone = { icone: Icone; titulo: string; texto: string };

export type SecaoBase = {
  /** Identificador estável (âncora e rastreamento de tempo de leitura) */
  id: string;
  /** Nome no menu lateral de capítulos */
  capitulo?: string;
  /** Número grande decorativo ("01", "02"...) */
  numero?: string;
  /** Exibir só quando a condição for verdadeira (ex.: "observacoes", "!expirada") */
  mostrarSe?: string;
};

export type SecaoCapa = SecaoBase & {
  tipo: "capa";
  eyebrow: string;
  titulo: string; // aceita quebra de linha \n
  tagline?: string;
  selos: { icone: Icone; texto: string; estilo?: "destaque" | "validade" }[];
};

export type SecaoAbertura = SecaoBase & {
  tipo: "abertura";
  chamada: string;
  titulo: string;
  destaque?: string;
  cards: CardIcone[];
};

export type SecaoSobre = SecaoBase & {
  tipo: "sobre";
  titulo: string;
  paragrafos: string[];
  numeros: { valor: number; sufixo?: string; formato?: "simples" | "milhar"; rotulo: string }[];
  valoresTitulo?: string;
  /** Uma letra grande por valor (ex.: "CADDI" -> C, A, D, D, I). Padrão: nome da empresa */
  letras?: string;
  valores: { palavra: string; texto: string }[];
};

export type SecaoConfianca = SecaoBase & {
  tipo: "confianca";
  titulo: string;
  paragrafos: string[];
  ilustracao?: "datacenter";
  grupos: { nome: string; selos: { sigla: string; codigo: string; descricao: string }[] }[];
};

export type SecaoMarcas = SecaoBase & { tipo: "marcas"; titulo: string; itens: string[] };

export type SecaoComparativo = SecaoBase & {
  tipo: "comparativo";
  titulo: string;
  rotuloMercado: string;
  itens: { icone: Icone; titulo: string; nosso: string; mercado: string }[];
};

export type SecaoEspecificacoes = SecaoBase & {
  tipo: "especificacoes";
  eyebrow?: string;
  titulo: string;
  subtitulo?: string;
  texto?: string;
  tituloTabela: string;
  selo?: string;
  nota?: string;
  linhas: { rotulo: string; valor: string }[];
};

export type SecaoInvestimento = SecaoBase & {
  tipo: "investimento";
  titulo: string;
  recorrente: {
    titulo: string;
    rotuloTotal: string;
    rodapeTotal?: string;
    aviso?: { icone: Icone; titulo: string; texto: string };
  };
  unico?: { titulo: string; intro?: string; itens: CardIcone[]; rotulo: string };
  observacoes?: { titulo: string };
};

export type BlocoResultado =
  | { estilo: "lista"; titulo: string; itens: CardIcone[] }
  | { estilo: "checks"; titulo: string; itens: string[]; nota?: string }
  | { estilo: "grade"; titulo: string; itens: CardIcone[] };

export type SecaoResultados = SecaoBase & { tipo: "resultados"; titulo: string; blocos: BlocoResultado[] };

export type SecaoCronograma = SecaoBase & { tipo: "cronograma"; titulo: string; etapas: CardIcone[] };

export type SecaoTexto = SecaoBase & { tipo: "texto"; eyebrow?: string; titulo: string; paragrafos: string[] };

export type SecaoFechamento = SecaoBase & {
  tipo: "fechamento";
  titulo: string;
  texto?: string;
  botao: string;
  site?: string;
};

export type Secao =
  | SecaoCapa
  | SecaoAbertura
  | SecaoSobre
  | SecaoConfianca
  | SecaoMarcas
  | SecaoComparativo
  | SecaoEspecificacoes
  | SecaoInvestimento
  | SecaoResultados
  | SecaoCronograma
  | SecaoTexto
  | SecaoFechamento;

export type TipoSecao = Secao["tipo"];

export const TIPOS_SECAO: { tipo: TipoSecao; nome: string; descricao: string }[] = [
  { tipo: "capa", nome: "Capa", descricao: "Logo, título, nome do cliente e selos (plano, validade)." },
  { tipo: "abertura", nome: "Abertura", descricao: "Frase de impacto e três cartões com ícone." },
  { tipo: "sobre", nome: "Quem somos", descricao: "Texto, números animados e valores com letras do nome." },
  { tipo: "confianca", nome: "Confiança", descricao: "Texto, ilustração e selos/certificações em abas." },
  { tipo: "marcas", nome: "Marcas/parceiros", descricao: "Faixa animada com nomes de parceiros." },
  { tipo: "comparativo", nome: "Diferenciais", descricao: "Nós x mercado, item a item." },
  { tipo: "especificacoes", nome: "Especificações", descricao: "Tabela técnica preenchida com os dados da proposta." },
  { tipo: "investimento", nome: "Investimento", descricao: "Mensalidade, desconto, taxa única e observações." },
  { tipo: "resultados", nome: "Resultados", descricao: "Listas de entregas, checks e grade de benefícios." },
  { tipo: "cronograma", nome: "Cronograma", descricao: "Etapas numeradas com linha do tempo animada." },
  { tipo: "texto", nome: "Texto livre", descricao: "Título e parágrafos." },
  { tipo: "fechamento", nome: "Fechamento", descricao: "Chamada final com aceite, comentário e recusa." },
];
