// FASE — "Fase X": automação de captura de XMLs fiscais para escritórios
// contábeis, cobrada por volume de CNPJs monitorados. Diferente dos planos de
// preço fixo: aqui a mensalidade é cotada conforme o volume contratado, com
// implantação/configuração cobrada uma única vez. SaaS, uso do software.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do escopo",
    padrao:
      "Automação da captura de documentos fiscais dos CNPJs monitorados, com monitoramento da SEFAZ 24/7 e entrega de XML e PDF organizados por CNPJ, tipo e período.",
  },
  {
    id: "mensalidade",
    tipo: "moeda",
    rotulo: "Mensalidade (R$)",
    padrao: 0,
    ajuda: "Valor conforme volume de CNPJs.",
  },
  {
    id: "cnpjs",
    tipo: "numero",
    rotulo: "CNPJs monitorados",
    padrao: 50,
    min: 1,
    max: 1000,
    largura: "meia",
    ajuda: "Gerenciamento de até 300 CNPJs por ambiente padrão.",
  },
  {
    id: "implantacao",
    tipo: "moeda",
    rotulo: "Implantação/configuração (R$)",
    padrao: 0,
    largura: "meia",
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
  recorrente: { base: { campo: "mensalidade" } },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "implantacao", rotulo: "Implantação (única)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Fase X",
    titulo: "Fase X",
    tagline: "Automação de XMLs fiscais para escritórios contábeis",
    selos: [
      { icone: "db", texto: "{{cnpjs}} CNPJs" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que o Fase X faz por **{{cliente}}**",
    titulo: "Os XMLs fiscais dos seus clientes capturados e organizados, sem trabalho manual.",
    destaque: "Cobrança por volume de CNPJs.",
    cards: [
      { icone: "refresh", titulo: "Monitoramento 24/7", texto: "a SEFAZ é consultada automaticamente, o tempo todo" },
      { icone: "db", titulo: "Captura automática", texto: "NF-e, NFS-e, CT-e, MDF-e e eventos de entrada e saída" },
      { icone: "upload", titulo: "XML e PDF organizados", texto: "entregues por CNPJ, tipo de documento e período" },
    ],
  },
  {
    id: "sobre",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A **Fase Sistemas** entrega soluções modulares de gestão, de A a Z, para cada tipo de operação. O **Fase X** é o serviço de automação da captura de documentos fiscais pensado para escritórios contábeis.",
      "Toda a configuração e o gerenciamento do ambiente ficam por conta da equipe da Fase Sistemas: os documentos passam a ser entregues automaticamente, sem intervenção manual.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "CNPJs por ambiente padrão" },
      { valor: 24, sufixo: "/7", rotulo: "monitoramento da SEFAZ" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade" },
    ],
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "O que está incluso",
    numero: "02",
    titulo: "O que está incluso",
    subtitulo: "Captura fiscal automática, de ponta a ponta",
    texto:
      "O **{{cliente}}** passa a receber os documentos fiscais dos CNPJs monitorados de forma automática, organizados e prontos para uso — sem precisar acessar plataforma nem baixar nada manualmente.",
    tituloTabela: "Serviços inclusos",
    nota: "Documentos não contemplados no escopo podem ser verificados mediante consulta prévia, conforme viabilidade técnica e disponibilidade da SEFAZ.",
    linhas: [
      { rotulo: "CNPJs monitorados", valor: "{{cnpjs}}" },
      { rotulo: "Monitoramento da SEFAZ", valor: "Automático, 24/7" },
      { rotulo: "Documentos capturados", valor: "NF-e, NFS-e, CT-e, MDF-e e eventos (entrada e saída)" },
      { rotulo: "Entrega", valor: "XML e PDF organizados por CNPJ, tipo e período" },
      { rotulo: "Download retroativo", valor: "Conforme disponibilidade da SEFAZ" },
      { rotulo: "Configuração e gerenciamento", valor: "Pela equipe Fase Sistemas" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "03",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Fase X",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais (SaaS, uso do software)",
      aviso: { icone: "db", titulo: "Cobrança por volume.", texto: "A mensalidade é definida conforme o volume de CNPJs monitorados." },
    },
    unico: { titulo: "Implantação/configuração", rotulo: "Investimento único", itens: [] },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "faq",
    tipo: "faq",
    capitulo: "Dúvidas",
    numero: "04",
    titulo: "Perguntas frequentes",
    itens: [
      { pergunta: "O que é preciso para ativar o serviço?", resposta: "O Certificado Digital A1 de cada CNPJ a ser monitorado, com a respectiva senha. Ele é condição técnica indispensável para a autenticação junto à SEFAZ." },
      { pergunta: "Meus dados ficam seguros?", resposta: "Sim. Os dados e certificados são tratados com sigilo pela Fase Sistemas, nos termos da Lei Geral de Proteção de Dados (LGPD)." },
      { pergunta: "O serviço pode ser interrompido?", resposta: "O serviço depende da disponibilidade da SEFAZ e dos portais oficiais. Mudanças técnicas desses órgãos podem afetar a captura, com análise de viabilidade pela equipe técnica." },
      { pergunta: "É licença ou assinatura?", resposta: "É assinatura (SaaS): você paga pelo uso do software, com atualizações e suporte inclusos." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos automatizar os XMLs do seu escritório?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseX: ModeloDef = {
  nome: "Fase X",
  descricao: "Automação da captura de XMLs fiscais para escritórios contábeis, cobrada por volume de CNPJs monitorados, com implantação única.",
  tipoSolucao: "fase-x",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
