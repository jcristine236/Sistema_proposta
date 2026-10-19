// CADDI — "Projeto": proposta de projeto pontual, com valor único (parcelável).
// Pensada para ser preenchida caso a caso: objetivo, escopo dos serviços,
// materiais/equipamentos, considerações, prazo, valor e parcelas. Baseada em uma
// proposta real de infraestrutura de rede, mas serve para qualquer projeto.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "projeto", tipo: "texto", rotulo: "Nome do projeto", padrao: "Modernização da infraestrutura de rede", obrigatorio: true },
  { id: "objetivo", tipo: "textoLongo", rotulo: "Objetivo", padrao: "Descreva em poucas linhas o objetivo do projeto e o resultado esperado para o cliente." },
  {
    id: "escopo",
    tipo: "lista",
    rotulo: "Escopo dos serviços",
    max: 20,
    rotuloTitulo: "Etapa / serviço (ex.: Distribuição principal)",
    rotuloDescricao: "O que inclui",
    ajuda: "Cada item vira uma linha na proposta. Preencha título e descrição.",
  },
  {
    id: "materiais",
    tipo: "lista",
    rotulo: "Materiais e equipamentos inclusos",
    max: 30,
    rotuloTitulo: "Item (ex.: 4 switches de 16 portas)",
    rotuloDescricao: "Detalhe (ex.: Operacional + modem)",
    ajuda: "Cada item vira uma linha na proposta. Preencha título e descrição.",
  },
  { id: "prazo", tipo: "texto", rotulo: "Prazo de entrega", padrao: "3 dias úteis" },
  { id: "valor", tipo: "moeda", rotulo: "Valor total do projeto (R$)", padrao: 0, passo: 100 },
  { id: "parcelas", tipo: "numero", rotulo: "Parcelas (boleto)", padrao: 1, min: 1, max: 36, largura: "meia" },
  { id: "consideracoes", tipo: "textoLongo", rotulo: "Considerações / o que não está incluso", padrao: "Liste aqui o que não está incluso (ex.: serviços civis, alvenaria, elétrica) e demais condições." },
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
  // Projeto é valor único (parcelável), sem mensalidade.
  unicos: [{ campo: "valor", rotulo: "Projeto" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · {{projeto}}",
    titulo: "Proposta\nde projeto",
    tagline: "Escopo, materiais e prazo definidos para o seu caso",
    selos: [
      { icone: "clock", texto: "Prazo: {{prazo}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "objetivo",
    tipo: "texto",
    capitulo: "Objetivo",
    numero: "01",
    titulo: "Objetivo do projeto",
    paragrafos: ["{{objetivo}}"],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a CADDI",
    numero: "02",
    titulo: "Quem é a CADDI?",
    paragrafos: [
      "Desde 2015 cuidamos da infraestrutura e da tecnologia de empresas de diversos segmentos, com atendimento próximo e um time que conhece a operação de cada cliente.",
      "Entregamos cada projeto com organização técnica, identificação dos pontos e testes de validação — para que tudo funcione do primeiro dia.",
    ],
    numeros: [
      { valor: 2015, formato: "simples", rotulo: "no mercado desde" },
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
    id: "escopo-secao",
    tipo: "campoLista",
    capitulo: "Escopo",
    numero: "03",
    titulo: "Escopo dos serviços",
    subtitulo: "O que será executado neste projeto",
    campo: "escopo",
    icone: "gear",
    mostrarSe: "escopo",
  },
  {
    id: "materiais-secao",
    tipo: "campoLista",
    capitulo: "Materiais",
    numero: "04",
    titulo: "Materiais e equipamentos inclusos",
    subtitulo: "Tudo o que acompanha a entrega",
    campo: "materiais",
    icone: "check",
    mostrarSe: "materiais",
  },
  {
    id: "composicao",
    tipo: "tabela",
    capitulo: "Investimento",
    numero: "05",
    titulo: "Itens de composição desta proposta",
    tabela: {
      colunas: ["Item", "Qtd", "Unitário (R$)", "Total (R$)"],
      linhas: [["{{projeto}}", "1", "{{valor|brl}}", "{{valor|brl}}"]],
    },
    nota: "**Total do projeto: {{calc.totalUnico|brl}}** — em até {{parcelas}}x no boleto bancário.",
  },
  {
    id: "prazo-pagamento",
    tipo: "texto",
    capitulo: "Prazo e pagamento",
    numero: "06",
    titulo: "Prazo e forma de pagamento",
    paragrafos: [
      "**Prazo de entrega:** {{prazo}}, podendo variar conforme as condições estruturais do local.",
      "**Forma de pagamento:** em até {{parcelas}}x no boleto bancário.",
    ],
  },
  {
    id: "consideracoes-secao",
    tipo: "texto",
    capitulo: "Considerações",
    numero: "07",
    titulo: "Considerações adicionais",
    paragrafos: ["{{consideracoes}}"],
    mostrarSe: "consideracoes",
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos tirar o projeto do papel?",
    botao: "Quero seguir com esta proposta",
    site: "CADDI.COM.BR",
  },
];

export const modeloCaddiProjeto: ModeloDef = {
  nome: "Projeto",
  descricao: "Proposta de projeto pontual com valor único parcelável: objetivo, escopo, materiais, prazo e forma de pagamento, todos preenchidos caso a caso.",
  tipoSolucao: "projeto-caddi",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
