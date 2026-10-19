// FASE — "Fase Agenda": sistema para salões, barbearias e estúdios, vendido por
// planos mensais de preço fixo (SaaS, sem taxa de implantação). Preços e recursos
// vêm da proposta oficial da Fase Sistemas. Os números da seção "sobre" são
// exemplos editáveis. O catálogo PLANOS_AGENDA é cadastrado pelo seed
// (categoria "fase-agenda").

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_AGENDA = [
  { codigo: "mei", nome: "MEI", preco: 159.9, atributos: { fiscais: "Até 15 emissões/mês", agendas: "2 agendas" } },
  { codigo: "intermediario", nome: "Intermediário", preco: 259.9, atributos: { fiscais: "Emissão ilimitada", agendas: "Até 6 agendas" } },
  { codigo: "avancado", nome: "Avançado", preco: 329.9, atributos: { fiscais: "Emissão ilimitada", agendas: "Até 8 agendas" } },
];

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "fase-agenda",
    padrao: "intermediario",
    obrigatorio: true,
  },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Adicionais contratados)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "plano" } },
  desconto: { campo: "desconto", limitePct: 15 },
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Fase Agenda",
    titulo: "Fase Agenda",
    tagline: "Sistema para salões, barbearias e estúdios",
    selos: [
      { icone: "calendar", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase Agenda faz por **{{cliente}}**",
    titulo: "Agenda, atendimento e fiscal do seu estúdio num só sistema.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "calendar", titulo: "Agendamento online", texto: "link de agenda 24h para os seus clientes marcarem" },
      { icone: "users", titulo: "Comissões e OS", texto: "ordem de serviço e comissões da equipe no controle" },
      { icone: "shield", titulo: "Fiscal em dia", texto: "NF-e, NFS-e e NFC-e emitidas direto do sistema" },
    ],
  },
  {
    id: "sobre",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase Agenda** é a versão pensada para salões de beleza, barbearias e estúdios.",
      "Você contrata só o plano que precisa e cresce de plano conforme a agenda enche, sem trocar de sistema.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 3, rotulo: "planos para escolher" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade" },
    ],
  },
  {
    id: "planos",
    tipo: "planos",
    capitulo: "Planos",
    numero: "02",
    titulo: "Escolha o seu plano",
    subtitulo: "Mensalidade fixa, sem fidelidade obrigatória. Os recursos são cumulativos: cada plano inclui tudo do anterior.",
    destacarCampo: "plano",
    planos: [
      {
        nome: "MEI",
        preco: "R$ 159,90",
        periodo: "/mês",
        descricao: "Para o profissional que está começando.",
        itens: ["NF-e, NFS-e e NFC-e (até 15 emissões/mês)", "Cadastros gerais", "Relatórios básicos", "Link de agendamento online (24h)", "Controle de agenda (2 agendas)"],
      },
      {
        nome: "Intermediário",
        preco: "R$ 259,90",
        periodo: "/mês",
        descricao: "O mais escolhido por salões e barbearias.",
        destaque: true,
        selo: "Mais escolhido",
        itens: ["Tudo do MEI", "Emissão fiscal ilimitada", "Ordem de serviço (OS)", "Financeiro completo", "Até 6 agendas incluídas"],
      },
      {
        nome: "Avançado",
        preco: "R$ 329,90",
        periodo: "/mês",
        descricao: "Para estúdios com equipe e alto movimento.",
        itens: ["Tudo do Intermediário", "Gerenciamento de comissões", "Controle de estoque e compras", "Painel do contador (Domínio e Questor)", "Até 8 agendas incluídas"],
      },
    ],
    nota: "Adicionais como Agenda extra, WhatsApp automático, Checkout Asaas, Cardápio Digital e Boleto integrado são contratados à parte (valores sob consulta).",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra na sua operação",
    subtitulo: "Gestão de A a Z para o seu salão, barbearia ou estúdio",
    texto:
      "O **{{cliente}}** passa a controlar agenda, atendimento, equipe e financeiro no mesmo sistema, com o fiscal sempre em dia. Conforme a agenda enche, é só subir de plano — sem trocar de sistema e sem perder histórico.",
    tituloTabela: "Principais recursos",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Emissão fiscal", valor: "{{plano.fiscais}}" },
      { rotulo: "Agendas incluídas", valor: "{{plano.agendas}}" },
      { rotulo: "Agendamento online (24h)", valor: "Incluso" },
      { rotulo: "Ordem de serviço (OS)", valor: "A partir do Intermediário" },
      { rotulo: "Gerenciamento de comissões", valor: "A partir do Avançado" },
      { rotulo: "Financeiro e relatórios", valor: "Incluso" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Fase Agenda — Plano {{plano.nome}}",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais (SaaS, uso do software)",
      aviso: { icone: "refresh", titulo: "Sem fidelidade obrigatória.", texto: "Planos mensais, com reajuste anual pelo IPCA do período de uso." },
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "faq",
    tipo: "faq",
    capitulo: "Dúvidas",
    numero: "05",
    titulo: "Perguntas frequentes",
    itens: [
      { pergunta: "Posso trocar de plano depois?", resposta: "Sim. Você sobe (ou desce) de plano conforme a necessidade, sem trocar de sistema e sem perder dados." },
      { pergunta: "Tem fidelidade?", resposta: "A contratação pode ser mensal, sem fidelidade, ou em contrato de 12 meses — você escolhe." },
      { pergunta: "Preciso de mais agendas do que o plano inclui?", resposta: "É possível contratar agendas extras à parte, com valor por agenda sob consulta." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar o seu estúdio no Fase Agenda?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseAgenda: ModeloDef = {
  nome: "Fase Agenda",
  descricao: "Sistema para salões, barbearias e estúdios, por planos mensais fixos (MEI a Avançado), com desconto e limite de aprovação.",
  tipoSolucao: "fase-agenda",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
