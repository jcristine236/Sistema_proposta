// FASE — "Fase Food": ERP para restaurantes e delivery, vendido por planos
// mensais de preço fixo (SaaS, sem taxa de implantação). Preços e recursos vêm
// da proposta oficial da Fase Sistemas. Os números da seção "sobre" são exemplos
// editáveis. O catálogo PLANOS_FOOD é cadastrado pelo seed (categoria "fase-food").

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export const PLANOS_FOOD = [
  { codigo: "basico", nome: "Básico", preco: 199.9, atributos: { fiscais: "NF-e e NFC-e" } },
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
    categoria: "fase-food",
    padrao: "intermediario",
    obrigatorio: true,
  },
  { id: "adicionais", tipo: "adicionais", rotulo: "Adicionais contratados", comQuantidade: true, rotuloQuantidade: "Usuários", max: 20, sugestoes: ["iFood", "AnotaAí", "ByFood", "Cardápio Digital", "Fast Food", "QR Code mesa", "Painel do Garçom", "WhatsApp automático", "Boleto integrado", "SEUPOS Food (por usuário)"], ajuda: "Adicione os opcionais e o valor de cada um. Para itens por usuário, informe o valor por usuário e a quantidade." },
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
    titulo: "Fase Food",
    tagline: "Sistema completo para restaurantes e delivery",
    selos: [
      { icone: "monitor", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase Food faz por **{{cliente}}**",
    titulo: "Do salão ao delivery, a operação inteira em um só sistema.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "monitor", titulo: "Frente de caixa e mesas", texto: "comandas, mesas e pedidos num fluxo só" },
      { icone: "rocket", titulo: "Delivery integrado", texto: "cardápio digital e controle do entregador" },
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
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase Food** é a versão pensada para restaurantes, bares, lanchonetes e delivery.",
      "Você contrata só o plano que precisa e cresce de plano conforme o movimento aumenta, sem trocar de sistema.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 4, rotulo: "planos para escolher" },
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
        nome: "Básico",
        preco: "R$ 199,90",
        periodo: "/mês",
        descricao: "Para começar a organizar a operação.",
        itens: ["NF-e e NFC-e", "Cadastros gerais", "Financeiro", "Controle de estoque", "Relatórios"],
      },
      {
        nome: "Intermediário",
        preco: "R$ 249,90",
        periodo: "/mês",
        descricao: "O mais escolhido por restaurantes.",
        destaque: true,
        selo: "Mais escolhido",
        itens: ["Tudo do Básico", "Emissão fiscal ilimitada", "Controle de mesas e comandas", "Pedido de venda", "Boleto integrado"],
      },
      {
        nome: "Avançado",
        preco: "R$ 309,90",
        periodo: "/mês",
        descricao: "Para quem tem salão e delivery.",
        itens: ["Tudo do Intermediário", "Controle do entregador", "Pedido de compra", "Módulo de produção", "Gerenciador XML"],
      },
      {
        nome: "Premium",
        preco: "R$ 549,90",
        periodo: "/mês",
        descricao: "Operação completa, sem limites.",
        itens: ["Tudo do Avançado", "Sped Contribuições", "Orçamento", "Relatórios completos", "Prioridade no suporte"],
      },
    ],
    nota: "Adicionais como iFood, AnotaAí, ByFood, Cardápio Digital, QR Code na mesa e Painel do Garçom são contratados à parte (valores sob consulta).",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "03",
    eyebrow: "Plano {{plano.nome}}",
    titulo: "Tudo o que entra na sua operação",
    subtitulo: "Gestão de A a Z para o seu restaurante",
    texto:
      "O **{{cliente}}** passa a controlar salão, cozinha, delivery, estoque e financeiro no mesmo sistema, com o fiscal sempre em dia. Conforme o movimento cresce, é só subir de plano — sem trocar de sistema e sem perder histórico.",
    tituloTabela: "Principais recursos",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos cumulativos: cada plano inclui tudo do anterior.",
    linhas: [
      { rotulo: "Emissão fiscal", valor: "{{plano.fiscais}}" },
      { rotulo: "Frente de caixa (PDV)", valor: "Incluso" },
      { rotulo: "Mesas e comandas", valor: "A partir do Intermediário" },
      { rotulo: "Delivery e entregador", valor: "A partir do Avançado" },
      { rotulo: "Estoque e financeiro", valor: "Incluso" },
      { rotulo: "Suporte técnico", valor: "Prioritário no Premium" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Fase Food — Plano {{plano.nome}}",
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
      { pergunta: "Os adicionais (iFood, Cardápio Digital...) já estão inclusos?", resposta: "Alguns recursos já vêm no plano. Integrações específicas são contratadas à parte, com valores sob consulta." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar o seu restaurante no Fase Food?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseFood: ModeloDef = {
  nome: "Fase Food",
  descricao: "ERP para restaurantes e delivery, por planos mensais fixos (Básico a Premium), com desconto e limite de aprovação.",
  tipoSolucao: "fase-food",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
