// Modelo CADDI — "Suporte e TI gerenciada". Contrato mensal de suporte e TI
// gerenciada: helpdesk humano, monitoramento proativo, gestão de estações e
// servidores, com SLA definido. Para alterar textos, ordem de seções ou campos,
// edite este arquivo e rode o seed novamente.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Escopo do contrato",
    padrao:
      "Helpdesk humano, monitoramento proativo do ambiente, gestão de estações e servidores, aplicação de atualizações e patches de segurança e atendimento conforme o SLA contratado. Um time que acompanha de perto a operação para evitar problemas antes que afetem o seu dia a dia.",
    ajuda: "Descreva o que entra no contrato de suporte. Este texto aparece na seção de escopo da proposta.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade (R$)", padrao: 2800, passo: 50 },
  { id: "estacoes", tipo: "numero", rotulo: "Estações atendidas", min: 0, max: 999, padrao: 15, largura: "meia", ajuda: "15 inclusas. Adicionais: R$ 35,00 cada." },
  {
    id: "sla",
    tipo: "selecao",
    rotulo: "SLA de atendimento",
    opcoes: [
      { valor: "8x5", rotulo: "8x5 (horário comercial)" },
      { valor: "12x5", rotulo: "12x5 (estendido, dias úteis)" },
      { valor: "24x7", rotulo: "24x7 (todos os dias, dia e noite)" },
    ],
    padrao: "12x5",
    largura: "meia",
  },
  { id: "implantacao", tipo: "moeda", rotulo: "Implantação (R$)", padrao: 1200, passo: 50 },
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
        campo: "estacoes",
        inclusos: 15,
        valorUnitario: 35,
        rotuloSingular: "estação adicional",
        rotuloPlural: "estações adicionais",
        rotuloLinha: "Estações atendidas",
        unidade: ["estação", "estações"],
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
    titulo: "Proposta\nComercial",
    tagline: "Mais de 11 anos de inovação e confiança",
    selos: [
      { icone: "headset", texto: "Suporte {{sla}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Imagine não ter que correr atrás quando algo para de funcionar.",
    destaque: "Isso é com a gente.",
    cards: [
      { icone: "headset", titulo: "Helpdesk humano", texto: "atendimento por pessoas, com SLA {{sla}}" },
      { icone: "monitor", titulo: "Monitoramento proativo", texto: "resolvemos antes que vire problema" },
      { icone: "laptop", titulo: "Gestão de estações", texto: "estações e servidores sempre em dia" },
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
    titulo: "Suporte e TI gerenciada para o **{{cliente}}**",
    subtitulo: "Seu ambiente monitorado e atendido com SLA {{sla}}",
    texto: "{{escopo}}",
    tituloTabela: "O que está incluso no contrato",
    selo: "{{estacoes}} estações · SLA {{sla}}",
    nota: "Atendimento + monitoramento inclusos na mensalidade",
    linhas: [
      { rotulo: "Helpdesk humano", valor: "Atendimento por pessoas, sem bots" },
      { rotulo: "SLA de atendimento", valor: "{{sla}}" },
      { rotulo: "Estações atendidas", valor: "{{estacoes}} estações" },
      { rotulo: "Monitoramento proativo", valor: "NOC acompanhando o ambiente" },
      { rotulo: "Gestão de servidores", valor: "Atualizações e patches de segurança" },
      { rotulo: "Relatórios de atendimento", valor: "Acompanhamento periódico" },
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
      { icone: "headset", titulo: "Suporte", nosso: "100% humano, com SLA {{sla}} e relacionamento próximo", mercado: "Central genérica, bots e filas" },
      { icone: "monitor", titulo: "Monitoramento", nosso: "Proativo: agimos antes do problema afetar você", mercado: "Só agem depois que algo quebra" },
      { icone: "laptop", titulo: "Estações", nosso: "Gestão contínua de estações e servidores", mercado: "Sem padrão nem controle do parque" },
      { icone: "shield", titulo: "Segurança", nosso: "Patches e atualizações sempre aplicados", mercado: "Segurança tratada como item opcional" },
      { icone: "clock", titulo: "Tempo de resposta", nosso: "SLA claro e combinado em contrato", mercado: "Sem prazo definido de atendimento" },
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
      titulo: "Suporte e TI gerenciada",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, valor fixo",
      aviso: { icone: "shield", titulo: "Sem multa contratual.", texto: 'Nossa retenção é relacionamento e resultado, não contrato "engessado".' },
    },
    unico: {
      titulo: "Implantação",
      intro: "O que compõe o processo de implantação:",
      rotulo: "Investimento único",
      itens: [
        { icone: "laptop", titulo: "Inventário das estações", texto: "Mapeamos as estações e servidores atendidos para iniciar o monitoramento." },
        { icone: "gear", titulo: "Configuração do ambiente", texto: "Instalamos os agentes de monitoramento e deixamos tudo pronto para o SLA combinado." },
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
          { icone: "headset", titulo: "Atendimento humano com SLA", texto: "Suporte {{sla}}, por pessoas que conhecem a sua operação." },
          { icone: "monitor", titulo: "Monitoramento contínuo e proativo", texto: "Alertas antes que problemas afetem sua operação." },
          { icone: "laptop", titulo: "Parque sempre em dia", texto: "Estações e servidores atualizados e padronizados." },
        ],
      },
      {
        estilo: "checks",
        titulo: "Gestão que acompanha a mensalidade",
        itens: [
          "Helpdesk humano conforme SLA contratado",
          "Monitoramento NOC (Centro de Operações de Rede)",
          "Instalação e atualização de patches de segurança",
          "Gestão de estações e servidores",
        ],
        nota: "Nosso grande diferencial é garantir que o ambiente permaneça atualizado e funcionando corretamente, com mais segurança e continuidade para a sua operação.",
      },
      {
        estilo: "grade",
        titulo: "Benefícios do suporte gerenciado",
        itens: [
          { icone: "clock", titulo: "Menos paradas", texto: "Problemas resolvidos antes de afetar o trabalho." },
          { icone: "headset", titulo: "Atendimento próximo", texto: "Pessoas, não bots, para falar com você." },
          { icone: "shield", titulo: "Mais segurança", texto: "Atualizações e controles sempre ativos." },
          { icone: "bolt", titulo: "Mais produtividade", texto: "Sua equipe focada no que importa." },
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
    titulo: "Cronograma de implantação",
    etapas: [
      { icone: "pen", titulo: "Assinatura", texto: "O processo começa com a assinatura digital do contrato." },
      { icone: "flag", titulo: "Kickoff", texto: "Alinhamos escopo, SLA e prioridades com o seu time." },
      { icone: "laptop", titulo: "Inventário", texto: "Mapeamos as estações e servidores que serão atendidos." },
      { icone: "gear", titulo: "Configuração", texto: "Instalamos os agentes de monitoramento no ambiente." },
      { icone: "shield", titulo: "Validação", texto: "Validamos monitoramento e canais de atendimento." },
      { icone: "rocket", titulo: "Operação", texto: "Suporte ativo, com monitoramento proativo em andamento." },
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

export const modeloCaddiSuporte: ModeloDef = {
  nome: "Suporte e TI gerenciada",
  descricao: "Contrato mensal de suporte e TI gerenciada: estações atendidas, SLA, implantação e desconto.",
  tipoSolucao: "suporte-gerenciado",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
