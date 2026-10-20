// FASE — "Fase Web": ERP modular para empresas em geral, vendido por planos
// mensais de preço fixo (SaaS, sem taxa de implantação). Preços e recursos vêm
// da proposta oficial da Fase Sistemas. Os números da seção "sobre" são exemplos
// editáveis. O catálogo PLANOS_WEB é cadastrado pelo seed (categoria "fase-web").

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_WEB = [
  { codigo: "mei", nome: "MEI", preco: 159.9, atributos: { fiscais: "Até 15 documentos/mês" } },
  { codigo: "basico", nome: "Básico", preco: 199.9, atributos: { fiscais: "Emissão ilimitada" } },
  { codigo: "intermediario", nome: "Intermediário", preco: 249.9, atributos: { fiscais: "Emissão ilimitada" } },
  { codigo: "avancado", nome: "Avançado", preco: 309.9, atributos: { fiscais: "Emissão ilimitada" } },
  { codigo: "premium", nome: "Premium", preco: 549.9, atributos: { fiscais: "Emissão ilimitada" } },
];

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "fase-web",
    padrao: "intermediario",
    obrigatorio: true,
  },
  { id: "adicionais", tipo: "adicionais", rotulo: "Adicionais contratados", comQuantidade: true, rotuloQuantidade: "Usuários", max: 20, sugestoes: ["Assinador Digital", "Boleto integrado", "PIX dinâmico no caixa", "WhatsApp automático", "SEUPOS (por usuário)", "SEUPDV (por usuário)", "Força de vendas (por usuário)", "Mercado Livre", "Cardápio Digital", "Cielo Connect"], ajuda: "Adicione os opcionais e o valor de cada um. Para itens por usuário, informe o valor por usuário e a quantidade." },
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
  recorrente: { base: { campo: "plano" }, extras: { campo: "adicionais" } },
  desconto: { campo: "desconto", limitePct: 15 },
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Fase Web",
    titulo: "Fase Web",
    tagline: "ERP modular para empresas em geral",
    selos: [
      { icone: "monitor", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase Web faz por **{{cliente}}**",
    titulo: "A gestão inteira da empresa em um só sistema modular.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "db", titulo: "Cadastros e estoque", texto: "clientes, fornecedores, produtos e estoque completo" },
      { icone: "money", titulo: "Financeiro de verdade", texto: "contas a pagar e receber e fluxo de caixa" },
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
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase Web** é a versão para empresas em geral — comércio, serviços, indústria e transporte.",
      "Você contrata só o plano que precisa e sobe de plano conforme a empresa cresce, sem trocar de sistema e sem perder histórico.",
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
        nome: "MEI",
        preco: "R$ 159,90",
        periodo: "/mês",
        descricao: "Para o microempreendedor começar certo.",
        itens: ["NF-e, NFS-e e NFC-e", "Até 15 documentos/mês", "Cadastros gerais", "Relatórios básicos"],
      },
      {
        nome: "Básico",
        preco: "R$ 199,90",
        periodo: "/mês",
        descricao: "Para organizar a operação por completo.",
        itens: ["Tudo do MEI", "Emissão fiscal ilimitada", "Estoque completo", "Financeiro completo", "Boleto integrado"],
      },
      {
        nome: "Intermediário",
        preco: "R$ 249,90",
        periodo: "/mês",
        descricao: "O mais escolhido pelas empresas.",
        destaque: true,
        selo: "Mais escolhido",
        itens: ["Tudo do Básico", "CT-e e MDF-e", "Ordem de serviço (OS)", "Gerenciador XML", "Pedido de venda"],
      },
      {
        nome: "Avançado",
        preco: "R$ 309,90",
        periodo: "/mês",
        descricao: "Para quem produz e precisa de mais controle.",
        itens: ["Tudo do Intermediário", "Módulo de produção", "Sped Fiscal", "Cotações e pedido de compra", "Faturamento de contrato"],
      },
      {
        nome: "Premium",
        preco: "R$ 549,90",
        periodo: "/mês",
        descricao: "Operação completa, sem limites.",
        itens: ["Tudo do Avançado", "Sped Contribuições", "Gerador de relatórios", "Painel exclusivo do contador", "Suporte prioritário com SLA"],
      },
    ],
    nota: "Adicionais como Assinador Digital, PIX dinâmico, WhatsApp automático, SEUPOS/SEUPDV, Mercado Livre, Cardápio Digital e Cielo Connect são contratados à parte (valores sob consulta).",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra na sua gestão",
    subtitulo: "Gestão de A a Z para a sua empresa",
    texto:
      "O **{{cliente}}** passa a controlar cadastros, estoque, financeiro e fiscal no mesmo sistema, com emissão de documentos sempre em dia. Conforme a empresa cresce, é só subir de plano — sem trocar de sistema e sem perder histórico.",
    tituloTabela: "Principais recursos",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Emissão fiscal", valor: "{{plano.fiscais}}" },
      { rotulo: "Cadastros e estoque", valor: "Incluso" },
      { rotulo: "Financeiro e centros de custo", valor: "Incluso" },
      { rotulo: "CT-e, MDF-e e OS", valor: "A partir do Intermediário" },
      { rotulo: "Módulo de produção e Sped Fiscal", valor: "A partir do Avançado" },
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
      titulo: "Fase Web — Plano {{plano.nome}}",
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
      { pergunta: "Os adicionais (PIX, WhatsApp, Mercado Livre...) já estão inclusos?", resposta: "Alguns recursos já vêm no plano. Integrações específicas são contratadas à parte, com valores sob consulta." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar a sua empresa no Fase Web?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseWeb: ModeloDef = {
  nome: "Fase Web",
  descricao: "ERP modular para empresas em geral, por planos mensais fixos (MEI a Premium), com desconto e limite de aprovação.",
  tipoSolucao: "fase-web",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
