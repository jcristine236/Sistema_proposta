// FASE — "Novo módulo (base)": modelo em branco para começar um módulo novo.
// É autossuficiente: a mensalidade é um valor digitado (não depende de catálogo
// de planos), então dá para DUPLICAR e ajustar sem configurar nada antes.
// Quando um módulo tiver planos fixos selecionáveis (como Fase Food/Agenda),
// peça para montarmos o catálogo — aí o campo "mensalidade" vira um campo "Plano".

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "modulo", tipo: "texto", rotulo: "Nome do módulo/sistema", padrao: "Fase [Módulo]", obrigatorio: true },
  { id: "escopo", tipo: "textoLongo", rotulo: "O que é / para quem", padrao: "Descreva em poucas linhas o que este módulo faz e para que tipo de operação ele serve." },
  {
    id: "recursos",
    tipo: "lista",
    rotulo: "O que está incluso",
    max: 30,
    rotuloTitulo: "Recurso (ex.: Emissão fiscal)",
    rotuloDescricao: "Detalhe (ex.: NF-e, NFS-e e NFC-e)",
    ajuda: "Cada item vira uma linha na proposta. Preencha título e descrição.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade (R$)", padrao: 199.9, passo: 10 },
  {
    id: "adicionais",
    tipo: "adicionais",
    rotulo: "Adicionais contratados",
    comQuantidade: true,
    rotuloQuantidade: "Usuários",
    max: 20,
    sugestoes: ["WhatsApp automático", "Boleto integrado", "PIX dinâmico", "Assinador Digital"],
    ajuda: "Adicione os opcionais e o valor de cada um. Para itens por usuário, informe o valor por usuário e a quantidade.",
  },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "mensalidade" }, extras: { campo: "adicionais" } },
  desconto: { campo: "desconto", limitePct: 15 },
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · {{modulo}}",
    titulo: "{{modulo}}",
    tagline: "Uma solução Fase Sistemas para a sua operação",
    selos: [{ icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" }],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o **{{modulo}}** faz por **{{cliente}}**",
    titulo: "Um sistema que organiza a sua operação, de A a Z.",
    destaque: "Sem mensalidade escondida.",
    cards: [
      { icone: "gear", titulo: "Processos no lugar", texto: "cadastros, rotinas e controles num só sistema" },
      { icone: "shield", titulo: "Fiscal e financeiro em dia", texto: "segurança e conformidade na operação" },
      { icone: "headset", titulo: "Suporte que entende você", texto: "time próximo do seu dia a dia" },
    ],
  },
  {
    id: "sobre",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. Você contrata só o que precisa e cresce conforme o negócio aumenta, sem trocar de sistema.",
      "Números de exemplo — ajuste com os dados reais no editor.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 10, sufixo: "+", rotulo: "módulos disponíveis" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade" },
    ],
  },
  {
    id: "o-que-e",
    tipo: "texto",
    capitulo: "A solução",
    numero: "02",
    titulo: "Sobre o {{modulo}}",
    paragrafos: ["{{escopo}}"],
  },
  {
    id: "incluso",
    tipo: "campoLista",
    capitulo: "O que está incluso",
    numero: "03",
    titulo: "O que está incluso",
    subtitulo: "Tudo o que acompanha o {{modulo}}",
    campo: "recursos",
    icone: "check",
    mostrarSe: "recursos",
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "{{modulo}}",
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
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
      { pergunta: "Tem fidelidade?", resposta: "A contratação pode ser mensal, sem fidelidade, ou em contrato de 12 meses — você escolhe." },
      { pergunta: "Posso crescer de módulo depois?", resposta: "Sim. O sistema é modular: você adiciona recursos conforme a necessidade, sem trocar de sistema." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos colocar o {{modulo}} para rodar?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseBase: ModeloDef = {
  nome: "Fase — Novo módulo (base)",
  descricao: "Modelo em branco para começar um módulo novo da FASE: duplique, renomeie e ajuste os campos, os recursos e a mensalidade.",
  tipoSolucao: "fase-base",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
