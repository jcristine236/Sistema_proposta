// Modelo FASE — "Sistema modular". A FASE entrega uma plataforma central e o
// cliente contrata os módulos que precisa; a mensalidade é a base + os módulos.
// Para alterar textos, ordem de seções ou campos, edite este arquivo e rode o
// seed novamente (ou edite pelo painel quando o editor visual estiver pronto).
//
// OBSERVAÇÃO: os números da seção "sobre" (anos de mercado, clientes, módulos,
// disponibilidade) são EXEMPLOS plausíveis e editáveis — ajuste aos dados reais
// da FASE antes de enviar a proposta.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do escopo",
    padrao: "Descreva aqui, em poucas linhas, a operação do cliente e quais módulos entram na plataforma.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade base (R$)", padrao: 390, passo: 10 },
  {
    id: "modulos",
    tipo: "numero",
    rotulo: "Módulos contratados",
    padrao: 3,
    min: 1,
    max: 50,
    largura: "meia",
    ajuda: "3 inclusos na base. Adicionais: R$ 180,00 por módulo.",
  },
  { id: "implantacao", tipo: "moeda", rotulo: "Implantação (R$)", padrao: 1500, passo: 10, largura: "meia" },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Prazo de contrato)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os campos com título e descrição preenchidos. Se nenhum estiver completo, a seção Observações não é exibida.",
  },
];

const precificacao: Precificacao = {
  recorrente: {
    base: { campo: "mensalidade" },
    adicionais: [
      {
        campo: "modulos",
        inclusos: 3,
        valorUnitario: 180,
        rotuloSingular: "módulo adicional",
        rotuloPlural: "módulos adicionais",
        rotuloLinha: "Módulos contratados",
        unidade: ["módulo", "módulos"],
      },
    ],
  },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "implantacao", rotulo: "Implantação (única)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Sistema modular",
    titulo: "Proposta\nComercial",
    tagline: "Soluções modulares, de A a Z",
    selos: [
      { icone: "gear", texto: "{{modulos}} módulos contratados" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Imagine um sistema que cresce junto com a sua operação, módulo por módulo.",
    destaque: "Isso é a FASE.",
    cards: [
      { icone: "home", titulo: "Uma plataforma central", texto: "a base única onde toda a operação acontece" },
      { icone: "gear", titulo: "Módulos sob medida", texto: "você contrata só o que precisa, quando precisa" },
      { icone: "refresh", titulo: "Cresce com você", texto: "novos módulos entram conforme a necessidade" },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A FASE Sistemas desenvolve plataformas de gestão **modulares, de A a Z**: uma base única e sólida, com módulos que entram conforme a operação da sua empresa cresce.",
      "Nosso compromisso é organizar o seu negócio em um só lugar, de forma confiável e sem reinventar a estrutura a cada etapa de crescimento.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "empresas usando a plataforma" },
      { valor: 12, rotulo: "módulos disponíveis" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade do sistema" },
    ],
    valoresTitulo: "O que guia a FASE em cada entrega",
    letras: "FASE",
    valores: [
      { palavra: "Flexibilidade", texto: "O sistema se adapta à sua operação, não o contrário." },
      { palavra: "Acompanhamento", texto: "Estamos perto da sua rotina, do primeiro módulo em diante." },
      { palavra: "Solidez", texto: "Uma base confiável que sustenta o crescimento sem sustos." },
      { palavra: "Evolução", texto: "A plataforma amadurece junto com o seu negócio." },
    ],
  },
  {
    id: "diferenciais",
    tipo: "comparativo",
    capitulo: "Diferenciais",
    numero: "02",
    titulo: "Por que escolher a FASE",
    rotuloMercado: "Sistema tradicional",
    itens: [
      { icone: "gear", titulo: "Contratação", nosso: "Você paga pelos módulos que realmente usa", mercado: "Pacote fechado, cheio de recursos que você nunca abre" },
      { icone: "refresh", titulo: "Crescimento", nosso: "Novos módulos entram sem trocar de sistema", mercado: "Troca de plataforma a cada mudança da operação" },
      { icone: "home", titulo: "Organização", nosso: "Toda a operação de A a Z em uma base única", mercado: "Vários sistemas soltos que não conversam entre si" },
      { icone: "headset", titulo: "Suporte", nosso: "Time que conhece a sua operação e seus módulos", mercado: "Central genérica, sem contexto do seu negócio" },
      { icone: "money", titulo: "Investimento", nosso: "Mensalidade previsível: base + módulos", mercado: "Custos escondidos e cobranças por uso difíceis de prever" },
    ],
  },
  {
    id: "modulos-disponiveis",
    tipo: "tabela",
    capitulo: "Módulos",
    numero: "03",
    titulo: "Módulos disponíveis na plataforma",
    subtitulo: "Monte o sistema de **{{cliente}}** combinando a base com os módulos que fizerem sentido para a operação.",
    tabela: {
      colunas: ["Módulo", "Para que serve"],
      linhas: [
        ["Financeiro", "Contas a pagar e a receber, fluxo de caixa e conciliação."],
        ["Estoque", "Controle de entradas, saídas, saldos e inventário."],
        ["Vendas / PDV", "Pedidos, frente de caixa e acompanhamento de vendas."],
        ["Fiscal / NF-e", "Emissão de notas fiscais e obrigações fiscais."],
        ["Compras", "Cotações, pedidos de compra e gestão de fornecedores."],
        ["RH", "Cadastro de colaboradores, jornada e rotinas de pessoal."],
        ["BI / Relatórios", "Indicadores e relatórios para decisão gerencial."],
      ],
    },
    nota: "A base já inclui 3 módulos. Cada módulo adicional custa R$ 180,00 por mês.",
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Plataforma modular",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, base + módulos contratados",
      aviso: { icone: "refresh", titulo: "Comece pelo essencial.", texto: "Você inicia com os módulos necessários e adiciona os demais conforme a operação pedir." },
    },
    unico: {
      titulo: "Implantação",
      intro: "O que compõe o processo de implantação:",
      rotulo: "Investimento único",
      itens: [
        { icone: "upload", titulo: "Configuração da plataforma", texto: "Preparamos a base e os módulos contratados de acordo com a sua operação." },
        { icone: "users", titulo: "Treinamento da equipe", texto: "Orientamos o time para que todos comecem a usar o sistema com segurança." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "05",
    titulo: "O que a sua empresa ganha",
    blocos: [
      {
        estilo: "lista",
        titulo: "O que sua empresa passa a ter",
        itens: [
          { icone: "home", titulo: "Tudo em um só lugar", texto: "A operação de A a Z organizada em uma única plataforma." },
          { icone: "refresh", titulo: "Crescimento sem retrabalho", texto: "Novos módulos entram sem trocar de sistema ou migrar tudo de novo." },
          { icone: "headset", titulo: "Suporte que entende você", texto: "Um time próximo, que conhece a sua operação e os seus módulos." },
        ],
      },
      {
        estilo: "grade",
        titulo: "Benefícios de uma plataforma modular",
        itens: [
          { icone: "gear", titulo: "Sob medida", texto: "Pague apenas pelos módulos que usa." },
          { icone: "money", titulo: "Previsibilidade", texto: "Mensalidade clara: base mais módulos." },
          { icone: "bolt", titulo: "Agilidade", texto: "Ative novos módulos de forma rápida." },
          { icone: "db", titulo: "Dados conectados", texto: "Os módulos conversam entre si, sem ilhas de informação." },
          { icone: "shield", titulo: "Confiabilidade", texto: "Uma base sólida que sustenta o seu crescimento." },
        ],
      },
    ],
  },
  {
    id: "faq",
    tipo: "faq",
    capitulo: "Dúvidas",
    numero: "06",
    titulo: "Perguntas frequentes",
    itens: [
      { pergunta: "O que já vem incluso na base?", resposta: "A mensalidade base inclui a plataforma central e 3 módulos à sua escolha. A partir daí, cada módulo adicional custa R$ 180,00 por mês." },
      { pergunta: "Posso contratar módulos depois?", resposta: "Sim. A ideia da FASE é crescer com você: novos módulos podem ser ativados a qualquer momento, sem trocar de sistema." },
      { pergunta: "Preciso contratar todos os módulos de uma vez?", resposta: "Não. Comece pelo que é essencial para a sua operação hoje e adicione os demais conforme a necessidade aparecer." },
      { pergunta: "Como funciona a implantação?", resposta: "Configuramos a plataforma e os módulos escolhidos e treinamos a sua equipe, com um valor único de implantação." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos montar o seu sistema?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseModular: ModeloDef = {
  nome: "Sistema modular",
  descricao: "Plataforma vendida por módulos: mensalidade base, módulos adicionais, implantação e desconto.",
  tipoSolucao: "modular",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
