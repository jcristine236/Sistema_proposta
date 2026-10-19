// Modelo KOLP — "Site e presença digital". A KOLP trata site como PROJETO B2B
// consultivo (não "vitrine de 5 páginas"): estudo do cliente, diagnóstico,
// objetivos, arquitetura do site, manutenção contínua e investimento.
// Precificação: criação (valor único) + manutenção mensal com a KOLP.
//
// ATENÇÃO: os números da seção "sobre" (projetos entregues, anos de atuação,
// clientes etc.) são VALORES DE EXEMPLO, editáveis depois pela usuária. Ajuste
// para a realidade da KOLP antes de enviar a proposta.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "projeto", tipo: "texto", rotulo: "Nome do projeto/site", padrao: "Novo site", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Entendimento do cliente (estudo de caso)",
    padrao:
      "Resuma o que entendemos do negócio na reunião: o que a empresa faz, quais públicos ela atende e o que o site precisa resolver. É esse entendimento que justifica um projeto mais robusto que um site comum.",
  },
  { id: "paginas", tipo: "numero", rotulo: "Páginas/seções", padrao: 8, min: 1, max: 999, largura: "meia" },
  { id: "criacao", tipo: "moeda", rotulo: "Criação do site (R$, único)", padrao: 6000, passo: 100, largura: "meia" },
  { id: "mensalidade", tipo: "moeda", rotulo: "Manutenção mensal (R$/mês)", padrao: 290, passo: 10 },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Prazo de entrega)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos. Se nenhum estiver completo, a seção Observações não é exibida.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "mensalidade" } },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "criacao", rotulo: "Criação do site (única)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Projeto de site",
    titulo: "Seu site,\ncomo projeto",
    tagline: "Estratégia, design e tecnologia para **{{cliente}}**",
    selos: [
      { icone: "monitor", texto: "{{projeto}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que a KOLP entrega para **{{cliente}}**",
    titulo: "Um projeto de site pensado para o seu negócio — não um modelo pronto de 5 páginas.",
    destaque: "Entendemos, construímos e mantemos no ar.",
    cards: [
      { icone: "target", titulo: "Entendimento primeiro", texto: "Partimos do seu negócio e dos seus públicos, não de um template genérico." },
      { icone: "pen", titulo: "Arquitetura e design", texto: "Estrutura de páginas e comunicação pensadas para captar o cliente certo." },
      { icone: "refresh", titulo: "Manutenção contínua", texto: "Cada atualização feita pela KOLP, preservando padrão técnico e performance." },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a KOLP",
    numero: "01",
    titulo: "Quem é a KOLP?",
    paragrafos: [
      "Somos um **estúdio de tecnologia e datacenter próprio**: unimos design, código e infraestrutura para colocar e manter seu site no ar com segurança.",
      "Tratamos cada site como um projeto, do entendimento do negócio à publicação, trabalhando lado a lado com você em cada etapa.",
    ],
    // ATENÇÃO: números de EXEMPLO — ajuste para a realidade da KOLP antes de enviar.
    numeros: [
      { valor: 2019, formato: "simples", rotulo: "no mercado desde" },
      { valor: 120, sufixo: "+", rotulo: "projetos entregues" },
      { valor: 60, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 100, sufixo: "%", rotulo: "hospedagem própria" },
    ],
  },
  {
    id: "diagnostico",
    tipo: "texto",
    capitulo: "Diagnóstico",
    numero: "02",
    eyebrow: "Por que um projeto, e não um site comum",
    titulo: "Diagnóstico e objetivos",
    paragrafos: [
      "A partir do estudo do seu negócio, entendemos que este **não é um site institucional simples de \"vitrine\"**: há públicos diferentes, com critérios de decisão e sensibilidades distintas. Isso justifica um escopo mais robusto que uma página padrão — e é importante alinhar essa expectativa antes de falar de preço.",
      "**O que eleva a complexidade real do projeto:** públicos distintos que precisam de mensagens e provas diferentes; hierarquia de conteúdo pensada para destacar o que importa; e captação qualificada, em que cada segmento é conduzido ao contato certo em vez de um formulário único genérico.",
      "**Objetivos do site:** posicionar o seu negócio com clareza para cada público; gerar contatos já qualificados e segmentados; comunicar todo o ecossistema de serviços sem diluir o foco principal; e manter o site sempre atualizado, com suporte contínuo da KOLP. {{escopo}}",
    ],
  },
  {
    id: "arquitetura",
    tipo: "especificacoes",
    capitulo: "A solução",
    numero: "03",
    eyebrow: "Escopo do projeto",
    titulo: "Arquitetura do site",
    subtitulo: "Estrutura, comunicação segmentada e captação qualificada",
    texto:
      "Desenhamos o **{{projeto}}** como uma arquitetura de conteúdo: uma estrutura de páginas que fala com cada público na linguagem certa e conduz o visitante até um contato qualificado. São cerca de **{{paginas}} páginas/seções** no escopo proposto.",
    tituloTabela: "O que compõe a arquitetura",
    selo: "{{projeto}}",
    nota: "Criação (valor único) + manutenção mensal com a KOLP.",
    linhas: [
      { rotulo: "Estrutura de páginas", valor: "{{paginas}} páginas/seções planejadas" },
      { rotulo: "Comunicação segmentada", valor: "Mensagem e provas por tipo de público" },
      { rotulo: "Captação qualificada", valor: "Contato que identifica e roteia cada lead" },
      { rotulo: "Design", valor: "Sob medida, responsivo (celular e desktop)" },
      { rotulo: "SEO técnico", valor: "Estrutura e dados pensados para busca" },
      { rotulo: "Desempenho e segurança", valor: "Site rápido, com SSL e hospedagem própria" },
    ],
  },
  {
    id: "pacotes",
    tipo: "planos",
    capitulo: "Pacotes",
    numero: "04",
    titulo: "Pacotes de projeto",
    subtitulo: "Pontos de partida para o **{{projeto}}**. Os valores finais desta proposta estão na seção Investimento.",
    planos: [
      {
        nome: "Institucional",
        preco: "a partir de R$ 4.500",
        periodo: "criação (valor único)",
        descricao: "Para presença profissional e objetiva, com público único.",
        itens: ["Até 6 páginas", "Design sob medida", "Responsivo (celular e desktop)", "SEO básico", "1 formulário de contato"],
      },
      {
        nome: "Profissional",
        preco: "a partir de R$ 7.900",
        periodo: "criação (valor único)",
        descricao: "Para quem precisa falar com públicos diferentes e captar leads segmentados.",
        itens: ["10+ páginas/blocos", "Comunicação segmentada por público", "Formulários roteados por segmento", "SEO técnico completo", "Design sob medida"],
        destaque: true,
        selo: "Mais indicado",
      },
      {
        nome: "Loja & sistema",
        preco: "sob consulta",
        periodo: "criação (valor único)",
        descricao: "Para e-commerce, áreas logadas ou funcionalidades personalizadas.",
        itens: ["Páginas e fluxos sob medida", "Catálogo e pagamento online", "Integrações (CRM, ERP, analytics)", "Área do cliente", "Escopo dimensionado caso a caso"],
      },
      {
        nome: "Projeto exclusivo",
        preco: "sob medida",
        periodo: "projeto personalizado",
        descricao: "Um site totalmente sob medida: o escopo e o valor desta proposta são os que preparamos para o **{{cliente}}**.",
        itens: ["Escopo desenhado especificamente para você", "Páginas e funcionalidades sem limite de pacote", "Valor e condições personalizados, logo abaixo"],
        selo: "Personalizado",
        ancora: "investimento",
        botao: "Ver proposta personalizada",
      },
    ],
    nota: "Pacotes ilustrativos. A configuração e o valor desta proposta são os definidos na seção Investimento.",
  },
  {
    id: "manutencao",
    tipo: "resultados",
    capitulo: "Manutenção KOLP",
    numero: "05",
    titulo: "Por que manter o site com a KOLP",
    blocos: [
      {
        estilo: "lista",
        titulo: "Cada atualização é feita por quem construiu o site",
        itens: [
          { icone: "shield", titulo: "Padrão técnico preservado", texto: "Textos, novos conteúdos e ajustes feitos sem risco de quebrar layout, performance ou SEO." },
          { icone: "bolt", titulo: "Desempenho e segurança", texto: "Hospedagem própria, SSL e monitoramento contínuos — o site sempre rápido e no ar." },
          { icone: "headset", titulo: "Canal direto com a KOLP", texto: "Pedidos de alteração atendidos por quem já conhece o seu projeto, com prazo combinado." },
        ],
      },
      {
        estilo: "checks",
        titulo: "O que a manutenção contínua garante",
        itens: [
          "Atualizações de conteúdo e novos materiais publicados pela equipe KOLP",
          "Correções e pequenos ajustes dentro do plano contratado",
          "Hospedagem, domínio, backup e monitoramento inclusos",
        ],
        nota: "Manter as atualizações sob responsabilidade da KOLP garante o mesmo padrão técnico da entrega original, atualização após atualização.",
      },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "06",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Manutenção mensal",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais",
      aviso: { icone: "refresh", titulo: "Site sempre atualizado.", texto: "Cada mudança feita pela KOLP, preservando padrão técnico, performance e segurança." },
    },
    unico: {
      titulo: "Criação do site",
      intro: "O que compõe a criação do {{projeto}} ({{calc.totalUnico|brl}}):",
      rotulo: "Investimento único",
      itens: [
        { icone: "target", titulo: "Entendimento e arquitetura", texto: "Estudo do negócio, mapa de conteúdo e estrutura de páginas por público." },
        { icone: "pen", titulo: "Design sob medida", texto: "Identidade visual aplicada em cada tela, pensada para captar o cliente certo." },
        { icone: "rocket", titulo: "Desenvolvimento e publicação", texto: "Site construído, testado e no ar, com SSL e SEO técnico." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "faq",
    tipo: "faq",
    capitulo: "Dúvidas",
    numero: "07",
    titulo: "Perguntas frequentes",
    itens: [
      {
        pergunta: "Por que o site custa mais que uma página pronta de mercado?",
        resposta:
          "Porque não é uma vitrine genérica: é um projeto com arquitetura de conteúdo, comunicação segmentada por público e captação qualificada, desenhado para resolver o problema de fundo do seu negócio.",
      },
      {
        pergunta: "Por que existe uma manutenção mensal?",
        resposta:
          "As atualizações pós-lançamento (textos, novos conteúdos, ajustes) são feitas pela KOLP, dentro do plano de manutenção e hospedagem. Isso mantém padrão técnico, performance e segurança a cada alteração.",
      },
      {
        pergunta: "Eu consigo editar o site sozinho?",
        resposta:
          "O site é mantido pela KOLP justamente para preservar o padrão da entrega. Todo pedido de alteração entra por um canal direto e é atendido dentro do plano contratado.",
      },
      {
        pergunta: "Quanto fica o investimento desta proposta?",
        resposta:
          "A criação é um valor único de {{calc.totalUnico|brl}} e a manutenção mensal fica em {{calc.totalMensal|brl}} por mês. Os detalhes estão na seção Investimento.",
      },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos tirar o {{projeto}} do papel?",
    botao: "Quero seguir com esta proposta",
    site: "KOLP.COM.BR",
  },
];

export const modeloKolpSite: ModeloDef = {
  nome: "Site e presença digital",
  descricao: "Projeto de site B2B consultivo (entendimento, diagnóstico, arquitetura) com criação (valor único) e manutenção mensal pela KOLP.",
  tipoSolucao: "site",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
