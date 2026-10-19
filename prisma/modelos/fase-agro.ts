// FASE — "Fase Agro": sistema de gestão para produtor rural e agronegócio,
// vendido por planos mensais de preço fixo (SaaS, sem taxa de implantação).
// Preços e recursos vêm da proposta oficial da Fase Sistemas. Os números da
// seção "sobre" são exemplos editáveis. O catálogo PLANOS_AGRO é cadastrado
// pelo seed (categoria "fase-agro").

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_AGRO = [
  { codigo: "light", nome: "Light", preco: 129.9, atributos: { fiscais: "Até 40 documentos/mês" } },
  { codigo: "basico", nome: "Básico", preco: 199.9, atributos: { fiscais: "Emissão ilimitada" } },
  { codigo: "intermediario", nome: "Intermediário", preco: 249.9, atributos: { fiscais: "Emissão ilimitada" } },
  { codigo: "avancado", nome: "Avançado", preco: 409.9, atributos: { fiscais: "Emissão ilimitada" } },
];

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "fase-agro",
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
    eyebrow: "Proposta comercial · Fase Agro",
    titulo: "Fase Agro",
    tagline: "Gestão para produtor rural e agronegócio",
    selos: [
      { icone: "leaf", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase Agro faz por **{{cliente}}**",
    titulo: "Da porteira ao fiscal, a fazenda inteira em um só sistema.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "leaf", titulo: "Gestão do campo", texto: "insumos, produção e frota num fluxo só" },
      { icone: "money", titulo: "Financeiro completo", texto: "contas, fluxo de caixa e boleto integrado" },
      { icone: "shield", titulo: "Fiscal em dia", texto: "NF-e, CT-e e MDF-e emitidos direto do sistema" },
    ],
  },
  {
    id: "sobre",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase Agro** é a versão pensada para o produtor rural, a fazenda e o agronegócio.",
      "Você contrata só o plano que precisa e cresce de plano conforme a operação aumenta, sem trocar de sistema.",
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
      { palavra: "Flexibilidade", texto: "O sistema cresce junto com a sua operação." },
      { palavra: "Acompanhamento", texto: "Suporte que entende o dia a dia do campo." },
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
        nome: "Light",
        preco: "R$ 129,90",
        periodo: "/mês",
        descricao: "Para começar a organizar a produção.",
        itens: ["Até 40 documentos/mês", "NF-e, CT-e e MDF-e", "Cadastros gerais", "Módulo de produção", "Relatórios básicos"],
      },
      {
        nome: "Básico",
        preco: "R$ 199,90",
        periodo: "/mês",
        descricao: "O mais escolhido por produtores rurais.",
        destaque: true,
        selo: "Mais escolhido",
        itens: ["Tudo do Light", "Emissão fiscal ilimitada", "LCDPR — Livro Caixa do Produtor", "Financeiro completo", "Gestão de frota"],
      },
      {
        nome: "Intermediário",
        preco: "R$ 249,90",
        periodo: "/mês",
        descricao: "Para quem quer controle total da operação.",
        itens: ["Tudo do Básico", "Mapeamento georreferenciado (KML)", "Romaneio de entrega", "Gerenciador XML", "Pedido de venda"],
      },
      {
        nome: "Avançado",
        preco: "R$ 409,90",
        periodo: "/mês",
        descricao: "Operação completa, sem limites.",
        itens: ["Tudo do Intermediário", "Gestão de Documentos", "Boleto integrado", "Orçamentos", "Painel do contador (Domínio e Questor)"],
      },
    ],
    nota: "Adicionais como Averbação, Assinador Digital, WhatsApp automático, Mercado Livre, SEUPOS, Força de vendas e Inscrição Estadual adicional são contratados à parte (valores sob consulta).",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra na sua operação",
    subtitulo: "Gestão de A a Z para a sua fazenda",
    texto:
      "O **{{cliente}}** passa a controlar produção, insumos, frota, financeiro e fiscal no mesmo sistema, com o campo sempre em dia. Conforme a operação cresce, é só subir de plano — sem trocar de sistema e sem perder histórico.",
    tituloTabela: "Principais recursos",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Emissão fiscal", valor: "{{plano.fiscais}}" },
      { rotulo: "NF-e, CT-e e MDF-e", valor: "Incluso" },
      { rotulo: "LCDPR e módulo de produção", valor: "A partir do Básico" },
      { rotulo: "Mapeamento georreferenciado (KML)", valor: "A partir do Intermediário" },
      { rotulo: "Gestão de frota e financeiro", valor: "A partir do Básico" },
      { rotulo: "Inscrição Estadual adicional", valor: "Adicional sob consulta" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Fase Agro — Plano {{plano.nome}}",
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
      { pergunta: "O sistema atende o LCDPR?", resposta: "Sim. A partir do plano Básico, o Fase Agro gera o Livro Caixa Digital do Produtor Rural (LCDPR)." },
      { pergunta: "Tem fidelidade?", resposta: "A contratação pode ser mensal, sem fidelidade, ou em contrato de 12 meses — você escolhe." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar a sua fazenda no Fase Agro?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseAgro: ModeloDef = {
  nome: "Fase Agro",
  descricao: "Sistema de gestão para produtor rural e agronegócio, por planos mensais fixos (Light a Avançado), com desconto e limite de aprovação.",
  tipoSolucao: "fase-agro",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
