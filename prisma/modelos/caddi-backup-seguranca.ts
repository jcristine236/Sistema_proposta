// Modelo CADDI — "Backup e segurança de dados". Backup automatizado em nuvem e
// proteção de dados: continuidade do negócio, proteção contra ransomware,
// retenção configurável e restauração rápida. Para alterar textos, ordem de
// seções ou campos, edite este arquivo e rode o seed novamente.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Escopo da proteção",
    padrao:
      "Backup automatizado em nuvem com rotina diária, proteção contra ransomware, cópias isoladas e restauração rápida. Monitoramento das rotinas e testes periódicos de recuperação para garantir a continuidade do negócio mesmo diante de falhas, ataques ou perda de dados.",
    ajuda: "Descreva o que entra na proteção de dados. Este texto aparece na seção de escopo da proposta.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade base (R$)", padrao: 900, passo: 50 },
  { id: "volume", tipo: "numero", rotulo: "Volume protegido (GB)", min: 0, max: 100000, padrao: 500, largura: "meia", ajuda: "500 GB inclusos. Adicionais: R$ 0,90 por GB." },
  {
    id: "retencao",
    tipo: "selecao",
    rotulo: "Retenção",
    opcoes: [
      { valor: "30 dias", rotulo: "30 dias" },
      { valor: "90 dias", rotulo: "90 dias" },
      { valor: "365 dias", rotulo: "365 dias" },
    ],
    padrao: "90 dias",
    largura: "meia",
  },
  { id: "implantacao", tipo: "moeda", rotulo: "Implantação (R$)", padrao: 800, passo: 50 },
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
        campo: "volume",
        inclusos: 500,
        valorUnitario: 0.9,
        rotuloSingular: "GB adicional",
        rotuloPlural: "GB adicionais",
        rotuloLinha: "Volume protegido",
        unidade: ["GB", "GB"],
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
      { icone: "backup", texto: "{{volume}} GB protegidos" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Imagine perder tudo e, mesmo assim, voltar a operar em pouco tempo.",
    destaque: "Isso é com a gente.",
    cards: [
      { icone: "backup", titulo: "Backup automatizado", texto: "cópias diárias em nuvem, sem você precisar lembrar" },
      { icone: "lock", titulo: "Proteção contra ransomware", texto: "cópias isoladas, fora do alcance de ataques" },
      { icone: "refresh", titulo: "Restauração rápida", texto: "retenção de {{retencao}} e recuperação quando precisar" },
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
    titulo: "Backup e segurança de dados para o **{{cliente}}**",
    subtitulo: "Seus dados protegidos e sempre recuperáveis",
    texto: "{{escopo}}",
    tituloTabela: "Configuração da proteção",
    selo: "{{volume}} GB · retenção {{retencao}}",
    nota: "Backup, monitoramento e testes de recuperação inclusos",
    linhas: [
      { rotulo: "Volume protegido", valor: "{{volume}} GB" },
      { rotulo: "Retenção das cópias", valor: "{{retencao}}" },
      { rotulo: "Rotina de backup", valor: "Diária e automatizada" },
      { rotulo: "Proteção contra ransomware", valor: "Cópias isoladas (imutáveis)" },
      { rotulo: "Monitoramento das rotinas", valor: "Alertas de falha de backup" },
      { rotulo: "Testes de recuperação", valor: "Validação periódica" },
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
      { icone: "backup", titulo: "Backup", nosso: "Automatizado, diário e monitorado na nuvem CADDI", mercado: "Cópias manuais, esquecidas com frequência" },
      { icone: "lock", titulo: "Ransomware", nosso: "Cópias isoladas e imutáveis, fora do alcance de ataques", mercado: "Backup no mesmo ambiente, vulnerável" },
      { icone: "refresh", titulo: "Recuperação", nosso: "Restauração rápida, com testes periódicos", mercado: "Recuperação incerta, nunca testada" },
      { icone: "clock", titulo: "Retenção", nosso: "Retenção de {{retencao}}, conforme sua necessidade", mercado: "Poucas versões, histórico curto" },
      { icone: "headset", titulo: "Suporte", nosso: "100% humano, time dedicado por cliente", mercado: "Central genérica, bots e filas" },
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
      titulo: "Backup e segurança de dados",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, valor fixo",
      aviso: { icone: "shield", titulo: "Sem multa contratual.", texto: 'Nossa retenção é relacionamento e resultado, não contrato "engessado".' },
    },
    unico: {
      titulo: "Implantação",
      intro: "O que compõe o processo de implantação:",
      rotulo: "Investimento único",
      itens: [
        { icone: "gear", titulo: "Configuração das rotinas", texto: "Definimos o que será protegido, a janela de backup e a retenção de {{retencao}}." },
        { icone: "check", titulo: "Primeiro backup e validação", texto: "Realizamos a primeira cópia e testamos a recuperação para garantir que tudo funciona." },
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
          { icone: "backup", titulo: "Dados protegidos todos os dias", texto: "{{volume}} GB com backup automatizado e monitorado." },
          { icone: "lock", titulo: "Proteção contra ransomware", texto: "Cópias isoladas que resistem a ataques e sequestro de dados." },
          { icone: "refresh", titulo: "Recuperação garantida", texto: "Retenção de {{retencao}} e restauração testada periodicamente." },
        ],
      },
      {
        estilo: "checks",
        titulo: "Proteção que acompanha a mensalidade",
        itens: [
          "Backup diário e automatizado em nuvem",
          "Cópias isoladas contra ransomware",
          "Monitoramento das rotinas e alertas de falha",
          "Testes periódicos de recuperação",
        ],
        nota: "Nosso grande diferencial é garantir que seus dados estejam sempre recuperáveis, com mais segurança e continuidade para a sua operação.",
      },
      {
        estilo: "grade",
        titulo: "Benefícios do backup CADDI",
        itens: [
          { icone: "shield", titulo: "Continuidade", texto: "Seu negócio segue operando mesmo após falhas." },
          { icone: "lock", titulo: "Mais segurança", texto: "Cópias protegidas contra ataques." },
          { icone: "refresh", titulo: "Restauração rápida", texto: "Volte a operar em pouco tempo." },
          { icone: "cloud", titulo: "Sem equipamento local", texto: "Tudo na nuvem CADDI, sem hardware extra." },
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
      { icone: "flag", titulo: "Kickoff", texto: "Definimos o que será protegido e a retenção de {{retencao}}." },
      { icone: "gear", titulo: "Configuração", texto: "Configuramos as rotinas de backup e o monitoramento." },
      { icone: "backup", titulo: "Primeiro backup", texto: "Realizamos a primeira cópia dos {{volume}} GB protegidos." },
      { icone: "check", titulo: "Validação", texto: "Testamos a recuperação para garantir que tudo funciona." },
      { icone: "rocket", titulo: "Proteção ativa", texto: "Backup rodando diariamente, com monitoramento contínuo." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos proteger seus dados juntos?",
    botao: "Quero seguir com esta proposta",
    site: "CADDI.COM.BR",
  },
];

export const modeloCaddiBackup: ModeloDef = {
  nome: "Backup e segurança de dados",
  descricao: "Backup em nuvem e proteção de dados: volume protegido, retenção, implantação e desconto.",
  tipoSolucao: "backup-seguranca",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
