// FASE — "Fase Clínicas": sistema para clínicas médicas e consultórios,
// vendido por planos mensais de preço fixo (SaaS, sem taxa de implantação).
// Preços e recursos vêm da proposta oficial da Fase Sistemas. Os números da
// seção "sobre" são exemplos editáveis. O catálogo PLANOS_CLINICAS é cadastrado
// pelo seed (categoria "fase-clinicas").

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_CLINICAS = [
  { codigo: "light", nome: "Light", preco: 149.9, atributos: { fiscais: "NF-e e NFC-e", porte: "Até 2 profissionais" } },
  { codigo: "basico", nome: "Básico", preco: 199.9, atributos: { fiscais: "NF-e e NFC-e", porte: "Até 4 profissionais" } },
  { codigo: "intermediario", nome: "Intermediário", preco: 309.9, atributos: { fiscais: "NF-e e NFC-e", porte: "Até 6 profissionais" } },
  { codigo: "avancado", nome: "Avançado", preco: 499.9, atributos: { fiscais: "NF-e e NFC-e", porte: "Até 8 profissionais" } },
  { codigo: "premium", nome: "Premium", preco: 579.9, atributos: { fiscais: "NF-e e NFC-e", porte: "Profissionais ilimitados" } },
];

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "fase-clinicas",
    padrao: "basico",
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
    eyebrow: "Proposta comercial · Fase Clínicas",
    titulo: "Fase Clínicas",
    tagline: "Sistema para clínicas médicas e consultórios",
    selos: [
      { icone: "heart", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase Clínicas faz por **{{cliente}}**",
    titulo: "Da recepção ao prontuário, a clínica inteira em um só sistema.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "calendar", titulo: "Agenda e recepção", texto: "integração médico-recepção em tempo real" },
      { icone: "heart", titulo: "Prontuário eletrônico", texto: "pacientes, receitas e atestados num fluxo só" },
      { icone: "shield", titulo: "Fiscal em dia", texto: "NF-e e NFC-e emitidas direto do sistema" },
    ],
  },
  {
    id: "sobre",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase Clínicas** é a versão pensada para clínicas médicas, consultórios e profissionais de saúde.",
      "Você contrata só o plano que precisa e cresce de plano conforme a clínica aumenta o número de profissionais, sem trocar de sistema.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 5, rotulo: "planos para escolher" },
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
        nome: "Light",
        preco: "R$ 149,90",
        periodo: "/mês",
        descricao: "Para o consultório que está começando.",
        itens: ["Até 2 profissionais", "Prontuário eletrônico", "Controle de agendas", "Controle de pacientes", "NF-e e NFC-e"],
      },
      {
        nome: "Básico",
        preco: "R$ 199,90",
        periodo: "/mês",
        descricao: "O mais escolhido por clínicas.",
        destaque: true,
        selo: "Mais escolhido",
        itens: ["Tudo do Light", "Até 4 profissionais", "Integração médico-recepção", "Controle financeiro básico", "Emissão de relatórios"],
      },
      {
        nome: "Intermediário",
        preco: "R$ 309,90",
        periodo: "/mês",
        descricao: "Para clínicas em crescimento.",
        itens: ["Tudo do Básico", "Até 6 profissionais", "Controle de estoque", "Personalização de receitas", "Gerador de relatórios"],
      },
      {
        nome: "Avançado",
        preco: "R$ 499,90",
        periodo: "/mês",
        descricao: "Operação completa para clínicas maiores.",
        itens: ["Tudo do Intermediário", "Até 8 profissionais", "Centros de custo", "Orçamentos para pacientes", "Prescrição Digital Memed"],
      },
      {
        nome: "Premium",
        preco: "R$ 579,90",
        periodo: "/mês",
        descricao: "Sem limites de profissionais, suporte prioritário.",
        itens: ["Tudo do Avançado", "Profissionais ilimitados", "Suporte técnico prioritário", "SLA garantido", "Painel do contador"],
      },
    ],
    nota: "Adicionais como NFS-e, Link de reservas, Odontograma, Boleto integrado, WhatsApp automático e Assinador Digital são contratados à parte (valores sob consulta).",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra na sua clínica",
    subtitulo: "Gestão de A a Z para o seu consultório",
    texto:
      "O **{{cliente}}** passa a controlar agenda, prontuário, pacientes, financeiro e fiscal no mesmo sistema, com o atendimento sempre organizado. Conforme a clínica cresce, é só subir de plano — sem trocar de sistema e sem perder histórico.",
    tituloTabela: "Principais recursos",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Profissionais", valor: "{{plano.porte}}" },
      { rotulo: "Emissão fiscal", valor: "{{plano.fiscais}}" },
      { rotulo: "Prontuário eletrônico e agenda", valor: "Incluso" },
      { rotulo: "Integração médico-recepção", valor: "A partir do Básico" },
      { rotulo: "Prescrição Digital Memed", valor: "A partir do Avançado" },
      { rotulo: "Suporte técnico prioritário", valor: "Prioritário no Premium" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Fase Clínicas — Plano {{plano.nome}}",
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
      { pergunta: "Posso trocar de plano depois?", resposta: "Sim. Você sobe (ou desce) de plano conforme o número de profissionais, sem trocar de sistema e sem perder dados." },
      { pergunta: "O sistema tem prescrição digital?", resposta: "Sim. A partir do plano Avançado, o Fase Clínicas inclui a Prescrição Digital Memed, com validade legal." },
      { pergunta: "Tem fidelidade?", resposta: "A contratação pode ser mensal, sem fidelidade, ou em contrato de 12 meses — você escolhe." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar a sua clínica no Fase Clínicas?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseClinicas: ModeloDef = {
  nome: "Fase Clínicas",
  descricao: "Sistema para clínicas médicas e consultórios, por planos mensais fixos (Light a Premium), com desconto e limite de aprovação.",
  tipoSolucao: "fase-clinicas",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
