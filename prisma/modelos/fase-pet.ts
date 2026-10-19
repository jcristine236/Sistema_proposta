// FASE — "Fase Pet": sistema para pet shops e clínicas veterinárias, vendido por
// planos mensais de preço fixo (SaaS, sem taxa de implantação). Preços e recursos
// vêm da proposta oficial da Fase Sistemas. Os números da seção "sobre" são
// exemplos editáveis. O catálogo PLANOS_PET é cadastrado pelo seed (categoria "fase-pet").

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_PET = [
  { codigo: "basico", nome: "Básico", preco: 199.9, atributos: { fiscais: "NF-e e NFC-e", porte: "Até 10 profissionais" } },
  { codigo: "intermediario", nome: "Intermediário", preco: 249.9, atributos: { fiscais: "Emissão ilimitada", porte: "11 a 20 profissionais" } },
  { codigo: "avancado", nome: "Avançado", preco: 309.9, atributos: { fiscais: "Emissão ilimitada", porte: "21 a 30 profissionais" } },
  { codigo: "premium", nome: "Premium", preco: 549.9, atributos: { fiscais: "Emissão ilimitada", porte: "Mais de 30 profissionais" } },
];

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "fase-pet",
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
    eyebrow: "Proposta comercial · Fase Pet",
    titulo: "Fase Pet",
    tagline: "Sistema para pet shops e clínicas veterinárias",
    selos: [
      { icone: "monitor", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase Pet faz por **{{cliente}}**",
    titulo: "Do balcão ao prontuário, a clínica e o pet shop num só sistema.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "heart", titulo: "Ficha do pet", texto: "prontuário eletrônico, anamnese e histórico do animal" },
      { icone: "calendar", titulo: "Agenda e serviços", texto: "agenda, banho e tosa e combos de serviços" },
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
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase Pet** é a versão pensada para pet shops e clínicas veterinárias.",
      "Você contrata só o plano que precisa e sobe de plano conforme a equipe aumenta, sem trocar de sistema e sem perder histórico.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 4, rotulo: "planos para escolher" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade" },
    ],
    valoresTitulo: "O que guia a Fase Sistemas",
    letras: "FASE",
    valores: [
      { palavra: "Flexibilidade", texto: "O sistema cresce junto com a sua clínica." },
      { palavra: "Acompanhamento", texto: "Suporte que entende o dia a dia do seu negócio." },
      { palavra: "Solidez", texto: "Base fiscal e financeira confiável, sempre atualizada." },
      { palavra: "Evolução", texto: "Novas funções e melhorias liberadas de forma contínua." },
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
        nome: "Básico",
        preco: "R$ 199,90",
        periodo: "/mês",
        descricao: "Para começar a organizar o pet shop.",
        itens: ["Até 10 profissionais", "NF-e e NFC-e", "Cadastros gerais", "Controle de agenda", "Controle de estoque"],
      },
      {
        nome: "Intermediário",
        preco: "R$ 249,90",
        periodo: "/mês",
        descricao: "O mais escolhido por clínicas e pet shops.",
        destaque: true,
        selo: "Mais escolhido",
        itens: ["11 a 20 profissionais", "Tudo do Básico", "NFS-e", "Prontuário eletrônico do pet", "Orçamentos e combos de serviços"],
      },
      {
        nome: "Avançado",
        preco: "R$ 309,90",
        periodo: "/mês",
        descricao: "Para clínicas com mais movimento.",
        itens: ["21 a 30 profissionais", "Tudo do Intermediário", "Anamnese", "Controle de delivery e entregador", "Gerenciamento de vendas"],
      },
      {
        nome: "Premium",
        preco: "R$ 549,90",
        periodo: "/mês",
        descricao: "Operação completa, sem limites.",
        itens: ["Mais de 30 profissionais", "Tudo do Avançado", "Sped Fiscal e Contribuições", "Painel do contador (Domínio e Questor)", "Suporte prioritário com SLA"],
      },
    ],
    nota: "Adicionais como Controle de vacinas, Hospedagem do animal, WhatsApp automático, Assinador Digital, SEUPOS e Cardápio Digital/Delivery são contratados à parte (valores sob consulta).",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra na sua clínica",
    subtitulo: "Gestão de A a Z para o seu pet shop",
    texto:
      "O **{{cliente}}** passa a controlar ficha do animal, agenda, prontuário, estoque e financeiro no mesmo sistema, com o fiscal sempre em dia. Conforme a equipe cresce, é só subir de plano — sem trocar de sistema e sem perder histórico.",
    tituloTabela: "Principais recursos",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Emissão fiscal", valor: "{{plano.fiscais}}" },
      { rotulo: "Profissionais", valor: "{{plano.porte}}" },
      { rotulo: "Prontuário e anamnese do pet", valor: "A partir do Intermediário" },
      { rotulo: "Agenda e combos de serviços", valor: "Incluso" },
      { rotulo: "Estoque e financeiro", valor: "Incluso" },
      { rotulo: "Painel do contador (Domínio e Questor)", valor: "No Premium" },
      { rotulo: "Suporte técnico", valor: "Prioritário com SLA no Premium" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Fase Pet — Plano {{plano.nome}}",
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
      { pergunta: "O plano limita a quantidade de profissionais?", resposta: "Cada plano atende uma faixa de profissionais. Conforme a equipe cresce, é só subir de plano." },
      { pergunta: "Os adicionais (vacinas, hospedagem...) já estão inclusos?", resposta: "Alguns recursos já vêm no plano. Integrações e módulos específicos são contratados à parte, com valores sob consulta." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar a sua clínica no Fase Pet?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFasePet: ModeloDef = {
  nome: "Fase Pet",
  descricao: "Sistema para pet shops e clínicas veterinárias, por planos mensais fixos (Básico a Premium), com desconto e limite de aprovação.",
  tipoSolucao: "fase-pet",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
