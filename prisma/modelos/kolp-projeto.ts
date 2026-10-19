// Modelo KOLP — "Projeto sob medida". Escopo fechado: valor único (parcelável)
// e manutenção mensal opcional após a entrega. Voz KOLP: estúdio de tecnologia
// digital, direto e orientado a design.
//
// ATENÇÃO: os números da seção "sobre" (projetos entregues, anos de atuação etc.)
// são VALORES DE EXEMPLO, editáveis depois pela usuária. Ajuste para a realidade
// da KOLP antes de enviar a proposta.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "projeto", tipo: "texto", rotulo: "Nome do projeto", padrao: "Projeto sob medida", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do escopo",
    padrao: "Descreva em poucas linhas o que será construído: principais funcionalidades, integrações e entregáveis.",
  },
  { id: "valorProjeto", tipo: "moeda", rotulo: "Valor do projeto (R$, único)", padrao: 18000, passo: 500 },
  { id: "parcelas", tipo: "numero", rotulo: "Parcelas", padrao: 3, min: 1, max: 24, largura: "meia" },
  { id: "manutencao", tipo: "moeda", rotulo: "Manutenção mensal (R$, opcional)", padrao: 0, passo: 10, largura: "meia" },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Premissas do escopo)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos. Se nenhum estiver completo, a seção Observações não é exibida.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "manutencao" } },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "valorProjeto", rotulo: "Valor do projeto (único)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Projeto sob medida",
    titulo: "Seu projeto,\nescopo fechado",
    tagline: "Software sob medida para **{{cliente}}**",
    selos: [
      { icone: "target", texto: "{{projeto}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Um produto digital construído do zero, exatamente para o seu problema.",
    destaque: "Escopo claro, preço fechado.",
    cards: [
      { icone: "target", titulo: "Escopo definido", texto: "Combinamos o que será entregue antes de começar, sem surpresas." },
      { icone: "money", titulo: "Valor único, parcelável", texto: "Preço fechado do projeto, que pode ser dividido em parcelas." },
      { icone: "refresh", titulo: "Manutenção opcional", texto: "Depois da entrega, você decide se quer suporte e evolução mensal." },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a KOLP",
    numero: "01",
    titulo: "Quem é a KOLP?",
    paragrafos: [
      "Somos um estúdio de tecnologia digital que cria **produtos sob medida**, unindo design, engenharia e foco no resultado.",
      "Trabalhamos por escopo fechado quando o problema já está claro: você sabe o que vai receber e quanto vai custar desde o início.",
    ],
    numeros: [
      { valor: 2019, formato: "simples", rotulo: "no mercado desde" },
      { valor: 120, sufixo: "+", rotulo: "projetos entregues" },
      { valor: 60, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 100, sufixo: "%", rotulo: "desenvolvido sob medida" },
    ],
  },
  {
    id: "escopo-entrega",
    tipo: "especificacoes",
    capitulo: "A solução",
    numero: "02",
    eyebrow: "Proposta",
    titulo: "O que vamos entregar",
    subtitulo: "O escopo fechado do {{projeto}}",
    texto: "Construímos o **{{projeto}}** sob medida, com escopo definido e entregas combinadas. {{escopo}}",
    tituloTabela: "Entregáveis do projeto",
    selo: "{{projeto}}",
    nota: "Valor único (parcelável) + manutenção mensal opcional após a entrega.",
    linhas: [
      { rotulo: "Modelo de projeto", valor: "Escopo fechado" },
      { rotulo: "Design", valor: "Sob medida, aprovado com você" },
      { rotulo: "Desenvolvimento", valor: "Código próprio e testado" },
      { rotulo: "Entrega", valor: "Produto publicado e funcionando" },
      { rotulo: "Pagamento", valor: "Em {{parcelas}} parcelas" },
      { rotulo: "Manutenção", valor: "Mensal e opcional após a entrega" },
    ],
  },
  {
    id: "diferenciais",
    tipo: "comparativo",
    capitulo: "Diferenciais",
    numero: "03",
    titulo: "Por que a KOLP",
    rotuloMercado: "Fornecedor comum",
    itens: [
      { icone: "target", titulo: "Escopo", nosso: "Definido e acordado antes de começar", mercado: "Vago, com mudanças e custos surpresa" },
      { icone: "money", titulo: "Preço", nosso: "Fechado e parcelável", mercado: "Aberto, cobrado por hora sem teto" },
      { icone: "pen", titulo: "Design", nosso: "Sob medida, aprovado com você", mercado: "Padrão, sem personalização" },
      { icone: "check", titulo: "Entrega", nosso: "Testada e no prazo combinado", mercado: "Atrasos e entregas incompletas" },
      { icone: "headset", titulo: "Pós-entrega", nosso: "Manutenção opcional com quem fez o projeto", mercado: "Projeto entregue e abandonado" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Manutenção mensal (opcional)",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais — opcional, após a entrega",
      aviso: { icone: "heart", titulo: "Manutenção é opcional.", texto: "Você contrata o suporte mensal só se quiser evolução contínua." },
    },
    unico: {
      titulo: "Valor do projeto",
      intro: "O valor do projeto ({{calc.totalUnico|brl}}) pode ser dividido em {{parcelas}} parcelas:",
      rotulo: "Investimento único",
      itens: [
        { icone: "pen", titulo: "Design e desenvolvimento", texto: "Todo o trabalho de criação, código e testes do {{projeto}}, no escopo combinado." },
        { icone: "rocket", titulo: "Entrega e publicação", texto: "Produto finalizado, publicado e pronto para uso, com acompanhamento inicial." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "cronograma",
    tipo: "cronograma",
    capitulo: "Cronograma",
    numero: "05",
    titulo: "Etapas do projeto",
    etapas: [
      { icone: "target", titulo: "Descoberta", texto: "Alinhamos escopo, objetivos e premissas do {{projeto}}." },
      { icone: "pen", titulo: "Design", texto: "Criamos as telas e o fluxo, e aprovamos com você." },
      { icone: "gear", titulo: "Desenvolvimento", texto: "Construímos o produto conforme o escopo combinado." },
      { icone: "check", titulo: "Testes", texto: "Validamos qualidade, desempenho e detalhes de uso." },
      { icone: "rocket", titulo: "Entrega", texto: "Publicamos o produto e acompanhamos o início da operação." },
    ],
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "06",
    titulo: "O que você ganha",
    blocos: [
      {
        estilo: "grade",
        titulo: "Benefícios de um projeto fechado com a KOLP",
        itens: [
          { icone: "target", titulo: "Previsibilidade", texto: "Escopo e preço definidos desde o início." },
          { icone: "money", titulo: "Flexibilidade", texto: "Valor parcelável, que cabe no seu fluxo de caixa." },
          { icone: "pen", titulo: "Produto exclusivo", texto: "Feito para o seu problema, não adaptado de terceiros." },
          { icone: "check", titulo: "Entrega garantida", texto: "Testes e prazo combinado antes de publicar." },
          { icone: "refresh", titulo: "Evolução opcional", texto: "Manutenção mensal quando você quiser continuar crescendo." },
        ],
      },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos construir o {{projeto}}?",
    botao: "Quero seguir com esta proposta",
    site: "KOLP.COM.BR",
  },
];

export const modeloKolpProjeto: ModeloDef = {
  nome: "Projeto sob medida",
  descricao: "Desenvolvimento sob medida por escopo fechado: valor único (parcelável) e manutenção mensal opcional.",
  tipoSolucao: "projeto",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
