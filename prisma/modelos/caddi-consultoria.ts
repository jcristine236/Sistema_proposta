// CADDI — "Consultoria de TI dedicada". Construído a partir da proposta real de
// consultoria de tecnologia da CADDI (pacote de horas mensais, foco em escritórios
// de contabilidade). Mensalidade sem taxa de implantação; horas excedentes e
// ferramentas sob medida são cobradas à parte.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do serviço",
    padrao:
      "Serviço contínuo de consultoria de tecnologia para identificar, validar e projetar melhorias de automação e otimização nos processos do cliente, a partir do acompanhamento próximo da rotina.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade do pacote (R$)", padrao: 2590, passo: 50 },
  { id: "horas", tipo: "numero", rotulo: "Horas mensais inclusas", padrao: 10, min: 1, max: 200, largura: "meia", ajuda: "Horas não utilizadas não acumulam para o mês seguinte." },
  { id: "horaAdicional", tipo: "moeda", rotulo: "Hora adicional (R$)", padrao: 290, passo: 10, largura: "meia", ajuda: "Horas que ultrapassam o pacote, aprovadas antes com o cliente." },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Modalidade de atendimento)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "mensalidade" } },
  desconto: { campo: "desconto", limitePct: 15 },
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    titulo: "Consultoria\nde TI dedicada",
    tagline: "Um profissional da CADDI acompanhando de perto a sua operação",
    selos: [
      { icone: "clock", texto: "{{horas}} horas por mês" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que a CADDI faz por **{{cliente}}**",
    titulo: "Alguém que entende de tecnologia olhando a sua rotina todo mês.",
    destaque: "Consultivo, não operacional.",
    cards: [
      { icone: "target", titulo: "Identifica oportunidades", texto: "pontos de automação e otimização na sua rotina" },
      { icone: "gear", titulo: "Valida e testa", texto: "coloca as ideias à prova antes de investir" },
      { icone: "rocket", titulo: "Aumenta a capacidade", texto: "a mesma equipe passa a atender mais, com menos esforço" },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a CADDI",
    numero: "01",
    titulo: "Quem é a CADDI?",
    paragrafos: [
      "A CADDI é especialista em tecnologia para **escritórios de contabilidade e empresas de serviços**. Mais do que suporte técnico, trazemos um olhar de automação e otimização aplicado à rotina de quem vive de processos.",
      "Na consultoria dedicada, um profissional do nosso time acompanha de perto o dia a dia do cliente, presencialmente ou por chamada online, identificando o que pode ser eliminado, automatizado ou melhorado.",
    ],
    numeros: [
      { valor: 2015, formato: "simples", rotulo: "cuidando de TI desde" },
      { valor: 500, sufixo: "+", rotulo: "empresas atendidas" },
      { valor: 10, rotulo: "horas de consultoria por mês" },
      { valor: 24, sufixo: "h", rotulo: "de monitoramento por dia" },
    ],
    valoresTitulo: "Nosso diferencial está nos valores que guiam o time todos os dias",
    letras: "CADDI",
    valores: [
      { palavra: "Compromisso", texto: "Parceria de verdade, presente na relação a longo prazo." },
      { palavra: "Agilidade", texto: "Respondemos com a urgência que cada situação exige." },
      { palavra: "Dedicação", texto: "Um time que conhece sua estrutura e suas prioridades." },
      { palavra: "Disciplina", texto: "Resultado consistente vem de processo e atenção aos detalhes." },
      { palavra: "Integridade", texto: "Falamos a verdade, mesmo quando não é o que se quer ouvir." },
    ],
  },
  {
    id: "servicos",
    tipo: "tabela",
    capitulo: "O que está incluso",
    numero: "02",
    titulo: "Serviços inclusos",
    subtitulo: "Frentes de atuação cobertas pelo pacote mensal",
    tabela: {
      colunas: ["Frente de atuação", "O que compreende"],
      linhas: [
        ["Acompanhamento periódico", "Visitas presenciais ou chamadas online recorrentes ao longo do mês, para acompanhar de perto a rotina."],
        ["Validação e testes", "Validação prática dos processos atuais e teste de melhorias, incluindo ideias já levantadas pelo seu time."],
        ["Identificação de oportunidades", "Mapeamento de pontos de automação, otimização e ganho de capacidade operacional."],
        ["Indicação de ferramentas", "Sugestão de soluções de mercado quando fizer mais sentido do que desenvolver algo novo."],
        ["Ferramentas sob medida", "Desenvolvimento específico quando não há solução de mercado (orçado e cobrado à parte)."],
      ],
    },
    nota: "O contrato contempla um pacote de {{horas}} horas mensais. As horas não utilizadas não acumulam para o mês seguinte.",
  },
  {
    id: "dinamica",
    tipo: "resultados",
    capitulo: "Como funciona",
    numero: "03",
    titulo: "Como funciona a consultoria",
    blocos: [
      {
        estilo: "lista",
        titulo: "Um trabalho próximo e contínuo, ao longo do mês",
        itens: [
          { icone: "users", titulo: "Acompanhamento no dia a dia", texto: "O profissional da CADDI acompanha a rotina, testa hipóteses e valida o que já funciona." },
          { icone: "bolt", titulo: "Ideias que saem do papel", texto: "Discutimos junto com o seu time as ideias que já estão na cabeça de vocês, mas ainda não foram executadas." },
          { icone: "flag", titulo: "Resumo a cada ciclo mensal", texto: "Ao final de cada mês, um resumo do que foi identificado, testado, implementado e do que está em andamento." },
        ],
      },
      {
        estilo: "checks",
        titulo: "Modalidade de atendimento",
        itens: [
          "Encontros presenciais nas suas dependências ou por chamada online, conforme a atividade",
          "Pacote de {{horas}} horas mensais dedicadas às frentes acima",
          "Agenda combinada entre as partes a cada ciclo",
        ],
        nota: "O papel da CADDI aqui é consultivo: gerar, validar e projetar melhorias — não executar a parte operacional do seu escritório.",
      },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Consultoria de TI dedicada ({{horas}}h/mês)",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, pacote de {{horas}} horas",
      aviso: { icone: "clock", titulo: "Hora adicional: {{horaAdicional|brl}}.", texto: "Demandas acima do pacote são orçadas e aprovadas antes com você. Ferramentas sob medida são cobradas à parte." },
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "exclusoes",
    tipo: "texto",
    capitulo: "O que não está incluso",
    numero: "05",
    titulo: "O que não está incluso",
    paragrafos: [
      "**Ferramentas de terceiros** necessárias para colocar as melhorias em prática: a aquisição é de responsabilidade do cliente.",
      "**A parte operacional do cliente** (rotinas fiscais, folha e atividades-fim do escritório): o papel da CADDI é consultivo.",
      "**Ferramentas sob medida**, que são orçadas e cobradas separadamente, e as **horas que ultrapassarem o pacote**, cobradas a {{horaAdicional|brl}} por hora, sempre aprovadas antes com o cliente.",
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos destravar a sua operação?",
    botao: "Quero seguir com esta proposta",
    site: "CADDI.COM.BR",
  },
];

export const modeloCaddiConsultoria: ModeloDef = {
  nome: "Consultoria de TI dedicada",
  descricao: "Consultoria de tecnologia dedicada por pacote de horas mensais, com acompanhamento contínuo, hora adicional e desconto com limite de aprovação.",
  tipoSolucao: "consultoria-ti",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
