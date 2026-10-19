// Modelo CADDI — "Gestão de TI dedicada". Um time dedicado assume a gestão
// completa da TI do cliente: planejamento, governança, roadmap, gestão de
// fornecedores, segurança e suporte. Para alterar textos, ordem de seções ou
// campos, edite este arquivo e rode o seed novamente.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Escopo da gestão",
    padrao:
      "A CADDI assume a gestão completa da TI, com planejamento estratégico, governança, roadmap de tecnologia, gestão de fornecedores, políticas de segurança e suporte ao time. Reuniões periódicas de acompanhamento e um ponto focal dedicado para o seu negócio.",
    ajuda: "Descreva o que entra na gestão dedicada. Este texto aparece na seção de escopo da proposta.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade (R$)", padrao: 4500, passo: 50 },
  { id: "usuarios", tipo: "numero", rotulo: "Usuários atendidos", min: 1, max: 999, padrao: 10, largura: "meia", ajuda: "10 inclusos. Adicionais: R$ 45,00 cada." },
  { id: "onboarding", tipo: "moeda", rotulo: "Onboarding e diagnóstico (R$)", padrao: 1500, passo: 50, largura: "meia" },
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
        campo: "usuarios",
        inclusos: 10,
        valorUnitario: 45,
        rotuloSingular: "usuário adicional",
        rotuloPlural: "usuários adicionais",
        rotuloLinha: "Usuários atendidos",
        unidade: ["usuário", "usuários"],
      },
    ],
  },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "onboarding", rotulo: "Onboarding e diagnóstico (único)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Gestão de TI dedicada",
    titulo: "Proposta\nComercial",
    tagline: "Mais de 11 anos de inovação e confiança",
    selos: [
      { icone: "gear", texto: "Gestão de TI dedicada" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Imagine ter um time de TI pensando no seu negócio todos os dias.",
    destaque: "Isso é com a gente.",
    cards: [
      { icone: "target", titulo: "Estratégia e roadmap", texto: "planejamento de tecnologia alinhado às metas do negócio" },
      { icone: "shield", titulo: "Governança e segurança", texto: "políticas, controles e gestão de fornecedores" },
      { icone: "headset", titulo: "Um time que entende de você", texto: "ponto focal dedicado e atendimento próximo" },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a CADDI",
    numero: "01",
    titulo: "Quem é a CADDI?",
    paragrafos: [
      "Desde 2015 cuidamos da infraestrutura de TI de empresas de diversos segmentos, acompanhando de perto a rotina de cada uma para que a tecnologia nunca seja um obstáculo.",
      "Nosso propósito é ser o parceiro de tecnologia que sua empresa merece ter, com atendimento humanizado, infraestrutura confiável e um time que conhece de perto a operação de cada cliente.",
    ],
    numeros: [
      { valor: 2015, formato: "simples", rotulo: "cuidando de TI desde" },
      { valor: 500, sufixo: "+", rotulo: "empresas atendidas" },
      { valor: 7000, rotulo: "usuários no Brasil" },
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
    id: "escopo",
    tipo: "especificacoes",
    capitulo: "A solução",
    numero: "02",
    eyebrow: "Proposta",
    titulo: "Gestão de TI dedicada para o **{{cliente}}**",
    subtitulo: "Um time que cuida da tecnologia por você",
    texto: "{{escopo}}",
    tituloTabela: "O que está incluso na gestão",
    selo: "{{usuarios}} usuários atendidos",
    nota: "Equipe dedicada + governança inclusas na mensalidade",
    linhas: [
      { rotulo: "Planejamento estratégico de TI", valor: "Roadmap e metas trimestrais" },
      { rotulo: "Governança e indicadores", valor: "Relatórios e reuniões de acompanhamento" },
      { rotulo: "Gestão de fornecedores", valor: "Negociação e controle de contratos" },
      { rotulo: "Segurança da informação", valor: "Políticas, controles e boas práticas" },
      { rotulo: "Suporte ao time", valor: "{{usuarios}} usuários atendidos" },
      { rotulo: "Ponto focal dedicado", valor: "Gestor de conta da CADDI" },
    ],
  },
  {
    id: "diferenciais",
    tipo: "comparativo",
    capitulo: "Diferenciais",
    numero: "03",
    titulo: "Diferenciais CADDI",
    rotuloMercado: "Mercado tradicional",
    itens: [
      { icone: "target", titulo: "Visão de negócio", nosso: "Gestão alinhada às metas e prioridades da sua empresa", mercado: "TI reativa, apenas apaga incêndios" },
      { icone: "users", titulo: "Time dedicado", nosso: "Ponto focal que conhece a sua operação de perto", mercado: "Atendimento genérico, sempre com pessoas diferentes" },
      { icone: "gear", titulo: "Governança", nosso: "Processos, indicadores e roadmap de tecnologia", mercado: "Decisões sem planejamento nem acompanhamento" },
      { icone: "shield", titulo: "Segurança", nosso: "Políticas e controles sempre ativos", mercado: "Segurança tratada como item opcional" },
      { icone: "headset", titulo: "Suporte", nosso: "100% humano, com relacionamento próximo", mercado: "Central genérica, bots e filas" },
      { icone: "pen", titulo: "Contrato", nosso: "Sem multa contratual", mercado: "Fidelidade obrigatória com multa" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Gestão de TI dedicada",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, valor fixo",
      aviso: { icone: "shield", titulo: "Sem multa contratual.", texto: 'Nossa retenção é relacionamento e resultado, não contrato "engessado".' },
    },
    unico: {
      titulo: "Onboarding e diagnóstico",
      intro: "O que compõe o início da parceria:",
      rotulo: "Investimento único",
      itens: [
        { icone: "target", titulo: "Diagnóstico completo do ambiente", texto: "Mapeamos a estrutura atual, riscos e oportunidades para montar o roadmap." },
        { icone: "flag", titulo: "Planejamento inicial", texto: "Definimos metas, prioridades e o plano dos primeiros ciclos de trabalho." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "05",
    titulo: "Resultados e projeções",
    blocos: [
      {
        estilo: "lista",
        titulo: "O que sua empresa passa a ter",
        itens: [
          { icone: "target", titulo: "TI alinhada ao negócio", texto: "Decisões de tecnologia guiadas pelas metas da empresa." },
          { icone: "monitor", titulo: "Acompanhamento contínuo", texto: "Indicadores e reuniões periódicas de gestão." },
          { icone: "headset", titulo: "Suporte técnico humanizado", texto: "Nossa equipe pronta para agir quando algo precisar de atenção." },
        ],
      },
      {
        estilo: "checks",
        titulo: "Gestão que acompanha a mensalidade",
        itens: [
          "Planejamento estratégico e roadmap de tecnologia",
          "Governança, indicadores e relatórios periódicos",
          "Gestão de fornecedores e contratos de TI",
          "Políticas de segurança da informação",
        ],
        nota: "Nosso grande diferencial é garantir que a tecnologia caminhe junto com o crescimento do seu negócio, com previsibilidade e segurança.",
      },
      {
        estilo: "grade",
        titulo: "Benefícios de uma gestão dedicada",
        itens: [
          { icone: "target", titulo: "Foco no negócio", texto: "Sua equipe se concentra no que importa." },
          { icone: "users", titulo: "Time especializado", texto: "Acesso a especialistas sem contratar internamente." },
          { icone: "bolt", titulo: "Mais agilidade", texto: "Decisões de TI mais rápidas e assertivas." },
          { icone: "shield", titulo: "Mais segurança", texto: "Riscos mapeados e controles ativos." },
          { icone: "money", titulo: "Previsibilidade", texto: "Valor fixo mensal, em reais." },
        ],
      },
    ],
  },
  {
    id: "cronograma",
    tipo: "cronograma",
    capitulo: "Cronograma",
    numero: "06",
    titulo: "Como começa a parceria",
    etapas: [
      { icone: "pen", titulo: "Assinatura", texto: "O processo começa com a assinatura digital do contrato." },
      { icone: "flag", titulo: "Kickoff", texto: "Realizamos o kickoff para alinhar expectativas e prioridades." },
      { icone: "target", titulo: "Diagnóstico", texto: "Mapeamos o ambiente atual, riscos e oportunidades." },
      { icone: "gear", titulo: "Roadmap", texto: "Montamos o plano de tecnologia e as metas dos próximos ciclos." },
      { icone: "refresh", titulo: "Rotina de gestão", texto: "Iniciamos o acompanhamento contínuo com reuniões periódicas." },
      { icone: "rocket", titulo: "Evolução", texto: "A TI evolui junto com o crescimento do seu negócio." },
    ],
  },
  {
    id: "faq",
    tipo: "faq",
    capitulo: "Dúvidas",
    numero: "07",
    titulo: "Perguntas frequentes",
    itens: [
      { pergunta: "Existe fidelidade ou multa?", resposta: "Não. Trabalhamos **sem multa contratual**. Nossa retenção é relacionamento e resultado." },
      { pergunta: "Quantos usuários estão inclusos?", resposta: "A mensalidade inclui o atendimento de {{usuarios}} usuários. Usuários adicionais custam R$ 45,00 cada." },
      { pergunta: "A CADDI substitui minha equipe interna?", resposta: "Podemos assumir a gestão completa ou atuar junto da sua equipe interna, conforme o escopo combinado." },
      { pergunta: "Como funciona o acompanhamento?", resposta: "Você tem um ponto focal dedicado e reuniões periódicas de gestão, com indicadores e roadmap de tecnologia." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos crescer juntos?",
    botao: "Quero seguir com esta proposta",
    site: "CADDI.COM.BR",
  },
];

export const modeloCaddiGestaoTi: ModeloDef = {
  nome: "Gestão de TI dedicada",
  descricao: "Consultoria e gestão de TI dedicada: mensalidade, usuários atendidos, onboarding e desconto com limite de aprovação.",
  tipoSolucao: "gestao-ti",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
