// Tipos de campo disponíveis no formulário de preenchimento de uma proposta.
// Cada Modelo define a sua lista de campos (Modelo.campos) usando estes tipos.

export type Largura = "inteira" | "meia";

type Base = {
  /** Chave do valor em proposta.dados e nos textos do modelo: {{id}} */
  id: string;
  rotulo: string;
  ajuda?: string;
  obrigatorio?: boolean;
  largura?: Largura;
};

export type CampoContato = Base & { tipo: "contato" };
export type CampoTexto = Base & { tipo: "texto"; placeholder?: string; padrao?: string; maxLength?: number };
export type CampoTextoLongo = Base & { tipo: "textoLongo"; placeholder?: string; padrao?: string };
export type CampoNumero = Base & { tipo: "numero"; min?: number; max?: number; passo?: number; padrao?: number };
export type CampoMoeda = Base & { tipo: "moeda"; padrao?: number; passo?: number };
export type CampoData = Base & { tipo: "data"; /** dias a partir de hoje */ padraoDias?: number };
export type CampoSelecao = Base & { tipo: "selecao"; opcoes: { valor: string; rotulo: string }[]; padrao?: string };
export type CampoCheckbox = Base & { tipo: "checkbox"; padrao?: boolean };

/** Escolha de um produto do catálogo (ex.: plano), com opção "Personalizado". */
export type CampoProduto = Base & {
  tipo: "produto";
  categoria: string;
  padrao?: string; // código do produto
  personalizado?: {
    rotulo: string;
    /** Atributos editáveis no plano personalizado (além de nome e preço) */
    atributos: { id: string; rotulo: string; sufixo?: string }[];
    nota?: string;
  };
};

/** Desconto percentual ou em valor, com limite que exige aprovação. */
export type CampoDesconto = Base & { tipo: "desconto"; limitePct?: number };

/** Lista de pares título/descrição (ex.: observações personalizadas). */
export type CampoLista = Base & {
  tipo: "lista";
  max?: number;
  rotuloTitulo?: string;
  rotuloDescricao?: string;
};

export type Campo =
  | CampoContato
  | CampoTexto
  | CampoTextoLongo
  | CampoNumero
  | CampoMoeda
  | CampoData
  | CampoSelecao
  | CampoCheckbox
  | CampoProduto
  | CampoDesconto
  | CampoLista;

export type TipoCampo = Campo["tipo"];

/** Catálogo exibido na tela de Modelos (documentação viva dos tipos de campo). */
export const TIPOS_CAMPO: { tipo: TipoCampo; nome: string; descricao: string }[] = [
  { tipo: "contato", nome: "Cliente", descricao: "Escolhe um contato cadastrado ou digita um novo nome de cliente." },
  { tipo: "texto", nome: "Texto curto", descricao: "Uma linha de texto (ex.: nome do projeto)." },
  { tipo: "textoLongo", nome: "Texto longo", descricao: "Parágrafo livre (ex.: escopo, premissas)." },
  { tipo: "numero", nome: "Número", descricao: "Quantidade inteira com mínimo e máximo (ex.: dispositivos)." },
  { tipo: "moeda", nome: "Valor (R$)", descricao: "Valor em reais (ex.: taxa de implantação)." },
  { tipo: "data", nome: "Data", descricao: "Data com padrão relativo a hoje (ex.: validade = hoje + 15 dias)." },
  { tipo: "selecao", nome: "Seleção", descricao: "Lista fixa de opções." },
  { tipo: "checkbox", nome: "Sim/Não", descricao: "Liga ou desliga um trecho da proposta." },
  { tipo: "produto", nome: "Produto/Plano", descricao: "Item do catálogo da empresa, com opção de plano personalizado." },
  { tipo: "desconto", nome: "Desconto", descricao: "Percentual ou valor fixo, com alerta acima do limite de aprovação." },
  { tipo: "lista", nome: "Lista de observações", descricao: "Pares título + descrição adicionados livremente." },
];

// ---------------------------------------------------------------------------
// Valores
// ---------------------------------------------------------------------------

export type ValorContato = { contatoId?: string; nome: string };
export type ValorProduto = {
  codigo: string; // código do produto ou "personalizado"
  personalizado?: { nome: string; preco: number; atributos: Record<string, number> };
};
export type ValorDesconto = { tipo: "nenhum" | "pct" | "valor"; valor: number };
export type ItemLista = { titulo: string; descricao: string };

export type Dados = Record<string, unknown>;

function hojeMais(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Valores iniciais do formulário a partir das definições de campo. */
export function valoresPadrao(campos: Campo[]): Dados {
  const dados: Dados = {};
  for (const c of campos) {
    switch (c.tipo) {
      case "contato": dados[c.id] = { nome: "" } satisfies ValorContato; break;
      case "texto":
      case "textoLongo": dados[c.id] = c.padrao ?? ""; break;
      case "numero":
      case "moeda": dados[c.id] = c.padrao ?? 0; break;
      case "data": dados[c.id] = hojeMais(c.padraoDias ?? 15); break;
      case "selecao": dados[c.id] = c.padrao ?? c.opcoes[0]?.valor ?? ""; break;
      case "checkbox": dados[c.id] = c.padrao ?? false; break;
      case "produto": dados[c.id] = { codigo: c.padrao ?? "" } satisfies ValorProduto; break;
      case "desconto": dados[c.id] = { tipo: "nenhum", valor: 0 } satisfies ValorDesconto; break;
      case "lista": dados[c.id] = [{ titulo: "", descricao: "" }] satisfies ItemLista[]; break;
    }
  }
  return dados;
}

/** Retorna mensagens de erro de preenchimento (vazio = válido). */
export function validar(campos: Campo[], dados: Dados): string[] {
  const erros: string[] = [];
  for (const c of campos) {
    if (!c.obrigatorio) continue;
    const v = dados[c.id];
    const vazio =
      v === undefined || v === null || v === "" ||
      (c.tipo === "contato" && !(v as ValorContato).nome?.trim()) ||
      (c.tipo === "produto" && !(v as ValorProduto).codigo);
    if (vazio) erros.push(`Preencha o campo "${c.rotulo}".`);
  }
  return erros;
}
