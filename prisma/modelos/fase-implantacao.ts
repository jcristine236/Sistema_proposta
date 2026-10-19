// Modelo FASE — "Implantação e projeto". Projeto de implantação de sistema com
// escopo e etapas, cobrado como valor único do projeto + sustentação mensal.
// Para alterar textos, ordem de seções ou campos, edite este arquivo e rode o
// seed novamente (ou edite pelo painel quando o editor visual estiver pronto).
//
// OBSERVAÇÃO: os números da seção "sobre" (anos de mercado, projetos entregues,
// módulos, disponibilidade) são EXEMPLOS plausíveis e editáveis — ajuste aos
// dados reais da FASE antes de enviar a proposta.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "projeto", tipo: "texto", rotulo: "Nome do projeto", padrao: "Projeto de implantação", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do escopo",
    padrao: "Descreva aqui, em poucas linhas, o que será implantado e quais áreas da operação serão atendidas.",
  },
  { id: "implantacao", tipo: "moeda", rotulo: "Valor do projeto (R$, único)", padrao: 12000, passo: 100 },
  { id: "sustentacao", tipo: "moeda", rotulo: "Sustentação mensal (R$)", padrao: 600, passo: 10 },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Prazo de contrato)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os campos com título e descrição preenchidos. Se nenhum estiver completo, a seção Observações não é exibida.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "sustentacao" } },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "implantacao", rotulo: "Valor do projeto (único)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Implantação e projeto",
    titulo: "Proposta\nComercial",
    tagline: "Soluções modulares, de A a Z",
    selos: [
      { icone: "rocket", texto: "{{projeto}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Um projeto de implantação conduzido de ponta a ponta, sem improviso.",
    destaque: "Do levantamento ao go-live.",
    cards: [
      { icone: "target", titulo: "Escopo bem definido", texto: "sabemos exatamente o que será entregue" },
      { icone: "calendar", titulo: "Etapas organizadas", texto: "um cronograma claro, de A a Z" },
      { icone: "headset", titulo: "Sustentação contínua", texto: "acompanhamento mensal depois do go-live" },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a FASE",
    numero: "01",
    titulo: "Quem é a FASE?",
    paragrafos: [
      "A FASE Sistemas entrega **soluções modulares, de A a Z**: implantamos a plataforma na sua operação com método, do levantamento ao go-live, e seguimos com você na sustentação.",
      "Nosso compromisso é que a virada de sistema seja organizada e confiável, sem interromper a sua operação e com a equipe preparada para o novo dia a dia.",
    ],
    numeros: [
      { valor: 2016, formato: "simples", rotulo: "no mercado desde" },
      { valor: 300, sufixo: "+", rotulo: "projetos implantados" },
      { valor: 12, rotulo: "módulos disponíveis" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade do sistema" },
    ],
    valoresTitulo: "O que guia a FASE em cada projeto",
    letras: "FASE",
    valores: [
      { palavra: "Foco", texto: "Escopo claro e etapas objetivas, do início ao fim." },
      { palavra: "Acompanhamento", texto: "Perto da sua equipe durante toda a implantação." },
      { palavra: "Segurança", texto: "Migração validada antes de qualquer go-live." },
      { palavra: "Entrega", texto: "Projeto concluído e operação rodando no novo sistema." },
    ],
  },
  {
    id: "escopo",
    tipo: "texto",
    capitulo: "Escopo",
    numero: "02",
    titulo: "O que vamos entregar",
    paragrafos: [
      "O projeto de implantação para **{{cliente}}** contempla o escopo abaixo, conduzido pela equipe da FASE com acompanhamento em cada etapa.",
      "{{escopo}}",
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "03",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Sustentação mensal",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, após o go-live",
      aviso: { icone: "headset", titulo: "Você não fica sozinho.", texto: "Depois da entrega, a sustentação mensal mantém o sistema atualizado e a sua equipe amparada." },
    },
    unico: {
      titulo: "Valor do projeto",
      intro: "O que compõe o projeto de implantação:",
      rotulo: "Investimento único",
      itens: [
        { icone: "target", titulo: "Levantamento e parametrização", texto: "Entendemos a sua operação e configuramos o sistema de acordo com ela." },
        { icone: "upload", titulo: "Migração e go-live", texto: "Migramos os dados, validamos o ambiente e colocamos a operação no ar com segurança." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "cronograma",
    tipo: "cronograma",
    capitulo: "Cronograma",
    numero: "04",
    titulo: "Etapas da implantação",
    etapas: [
      { icone: "target", titulo: "Levantamento", texto: "Mapeamos a operação e os requisitos do projeto junto com a sua equipe." },
      { icone: "gear", titulo: "Parametrização", texto: "Configuramos o sistema de acordo com as regras do seu negócio." },
      { icone: "upload", titulo: "Migração", texto: "Transferimos os dados para o novo ambiente de forma segura." },
      { icone: "users", titulo: "Treinamento", texto: "Preparamos a sua equipe para usar o sistema no dia a dia." },
      { icone: "rocket", titulo: "Go-live", texto: "Colocamos a operação no ar e acompanhamos os primeiros dias." },
    ],
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "05",
    titulo: "O que esperar do projeto",
    blocos: [
      {
        estilo: "lista",
        titulo: "O que sua empresa passa a ter",
        itens: [
          { icone: "flag", titulo: "Implantação com método", texto: "Cada etapa conduzida com escopo e cronograma definidos." },
          { icone: "shield", titulo: "Virada segura", texto: "Migração validada antes de colocar a operação no ar." },
          { icone: "headset", titulo: "Sustentação contínua", texto: "Acompanhamento mensal para manter tudo rodando." },
        ],
      },
      {
        estilo: "checks",
        titulo: "O que está incluído no projeto",
        itens: [
          "Levantamento de requisitos junto à sua equipe",
          "Parametrização do sistema conforme a sua operação",
          "Migração dos dados e validação do ambiente",
          "Treinamento da equipe e acompanhamento no go-live",
        ],
        nota: "O valor do projeto é único e cobre a implantação de ponta a ponta. A partir do go-live, a sustentação é mensal.",
      },
    ],
  },
  {
    id: "faq",
    tipo: "faq",
    capitulo: "Dúvidas",
    numero: "06",
    titulo: "Perguntas frequentes",
    itens: [
      { pergunta: "Qual a diferença entre o valor do projeto e a sustentação?", resposta: "O valor do projeto, de {{calc.totalUnico|brl}}, é cobrado uma única vez e cobre toda a implantação. A sustentação, de {{calc.totalMensal|brl}} por mês, começa após o go-live e mantém o sistema atualizado e a sua equipe amparada." },
      { pergunta: "Quanto tempo leva a implantação?", resposta: "O prazo depende do escopo, mas seguimos sempre as mesmas etapas: levantamento, parametrização, migração, treinamento e go-live." },
      { pergunta: "A operação para durante a migração?", resposta: "Não. Planejamos a migração para que a virada aconteça de forma segura, validando o ambiente antes do go-live." },
      { pergunta: "A sustentação é obrigatória?", resposta: "A sustentação mensal garante atualizações, suporte e acompanhamento depois da entrega, mantendo o sistema saudável no dia a dia." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos tirar o projeto do papel?",
    botao: "Quero seguir com esta proposta",
    site: "FASESISTEMAS.COM.BR",
  },
];

export const modeloFaseImplantacao: ModeloDef = {
  nome: "Implantação e projeto",
  descricao: "Projeto de implantação por escopo: valor único do projeto e sustentação mensal, com etapas e desconto.",
  tipoSolucao: "implantacao",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
