// KOLP — "Site por assinatura" (SaaS): o cliente tem o site no ar pagando uma
// mensalidade fixa (hospedagem + manutenção + evolução), sem um valor alto de
// criação na frente. Planos de preço fixo cadastrados pelo seed (categoria
// "kolp-site-saas"). Números da seção "sobre" são exemplos editáveis.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_SITE_SAAS = [
  { codigo: "basico", nome: "Básico", preco: 159.0, atributos: { paginas: "Landing page (1 página)" } },
  { codigo: "intermediario", nome: "Intermediário", preco: 259.0, atributos: { paginas: "Até 4 páginas + subpáginas" } },
  { codigo: "avancado", nome: "Avançado", preco: 359.0, atributos: { paginas: "Até 10 páginas + subpáginas" } },
];

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "projeto", tipo: "texto", rotulo: "Nome do site/projeto", padrao: "Novo site" },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "kolp-site-saas",
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
    rotuloTitulo: "Título (ex.: Domínio)",
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
    eyebrow: "Proposta comercial · Site por assinatura",
    titulo: "Seu site\nno ar",
    tagline: "Hospedagem, manutenção e evolução por uma mensalidade só",
    selos: [
      { icone: "globe", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que a KOLP entrega para **{{cliente}}**",
    titulo: "Seu site profissional no ar, sem dor de cabeça técnica.",
    destaque: "Você cuida do negócio, a KOLP cuida do site.",
    cards: [
      { icone: "rocket", titulo: "Site no ar rápido", texto: "publicação e hospedagem com certificado de segurança (HTTPS)" },
      { icone: "refresh", titulo: "Sempre atualizado", texto: "manutenção e pequenos ajustes todo mês, feitos pela KOLP" },
      { icone: "target", titulo: "Encontrado no Google", texto: "SEO básico e Google Meu Negócio desde o primeiro plano" },
    ],
  },
  {
    id: "sobre",
    tipo: "sobre",
    capitulo: "Quem é a KOLP",
    numero: "01",
    titulo: "Quem é a KOLP?",
    paragrafos: [
      "A **KOLP** cria e cuida de sites e aplicações, com datacenter próprio. No modelo por assinatura, você não paga um valor alto de criação na frente: tem o site no ar por uma **mensalidade fixa**, com hospedagem, manutenção e evolução incluídas.",
      "Cada atualização é feita por quem construiu o site, preservando padrão técnico, performance e segurança.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 200, sufixo: "+", rotulo: "projetos entregues" },
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
    subtitulo: "Mensalidade fixa, sem taxa de criação. Os recursos são cumulativos: cada plano inclui tudo do anterior.",
    destacarCampo: "plano",
    planos: [
      {
        nome: "Básico",
        preco: "R$ 159,00",
        periodo: "/mês",
        descricao: "Landing page profissional, no ar e no Google.",
        itens: [
          "Landing page (1 página)",
          "Hospedagem + certificado SSL (HTTPS)",
          "Manutenção mensal",
          "Site responsivo (celular e computador)",
          "Formulário de contato + botão de WhatsApp",
          "SEO básico (títulos, meta tags, sitemap, Search Console)",
          "Google Meu Negócio",
        ],
      },
      {
        nome: "Intermediário",
        preco: "R$ 259,00",
        periodo: "/mês",
        descricao: "Site institucional completo.",
        destaque: true,
        selo: "Mais escolhido",
        itens: [
          "Tudo do Básico",
          "Site até 4 páginas (e subpáginas)",
          "E-mail profissional (contato@seudominio)",
          "Integração com redes sociais",
          "Google Analytics (relatório de acessos)",
          "SEO on-page aprimorado",
        ],
      },
      {
        nome: "Avançado",
        preco: "R$ 359,00",
        periodo: "/mês",
        descricao: "Presença digital completa, com blog.",
        itens: [
          "Tudo do Intermediário",
          "Site até 10 páginas (e subpáginas)",
          "Blog / área de notícias",
          "Relatório mensal de acessos",
          "Otimização de performance e velocidade",
          "Prioridade no suporte",
        ],
      },
    ],
    nota: "O registro do domínio (.com.br) é contratado à parte, na Hostgator ou registro de preferência. A KOLP faz a configuração sem custo adicional.",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra no seu site",
    subtitulo: "Hospedagem, manutenção e evolução, todo mês",
    texto:
      "O site de **{{cliente}}** fica no ar com hospedagem, segurança e manutenção inclusas. Conforme o projeto cresce, é só subir de plano — sem refazer o site e sem taxa de criação.",
    tituloTabela: "Resumo do plano",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Páginas do site", valor: "{{plano.paginas}}" },
      { rotulo: "Hospedagem + SSL (HTTPS)", valor: "Incluso" },
      { rotulo: "Manutenção mensal", valor: "Incluso" },
      { rotulo: "SEO básico + Google Meu Negócio", valor: "Incluso" },
      { rotulo: "E-mail profissional", valor: "A partir do Intermediário" },
      { rotulo: "Blog / notícias", valor: "A partir do Avançado" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Site por assinatura — Plano {{plano.nome}}",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais (hospedagem, manutenção e evolução inclusas)",
      aviso: { icone: "shield", titulo: "Sem taxa de criação.", texto: "Você coloca o site no ar pagando só a mensalidade, com tudo incluído." },
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
      { pergunta: "Preciso pagar um valor de criação?", resposta: "Não. No modelo por assinatura você paga só a mensalidade, com hospedagem, manutenção e evolução inclusas." },
      { pergunta: "Posso trocar de plano depois?", resposta: "Sim. Você sobe de plano quando precisar de mais páginas ou recursos, sem refazer o site." },
      { pergunta: "O domínio está incluso?", resposta: "O registro do domínio é contratado à parte (ex.: Hostgator). A configuração é feita pela KOLP, sem custo adicional." },
      { pergunta: "Quem faz as atualizações do site?", resposta: "A própria KOLP, dentro do plano contratado, preservando o padrão técnico, a performance e a segurança." },
      { pergunta: "Tem fidelidade?", resposta: "A contratação pode ser mensal, sem fidelidade, ou em contrato anual — você escolhe." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar o seu site no ar?",
    botao: "Quero seguir com esta proposta",
    site: "KOLP.COM.BR",
  },
];

export const modeloKolpSiteSaas: ModeloDef = {
  nome: "Site por assinatura",
  descricao: "Site com hospedagem, manutenção e evolução por mensalidade fixa (SaaS): planos Básico, Intermediário e Avançado, sem taxa de criação.",
  tipoSolucao: "site-saas",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
