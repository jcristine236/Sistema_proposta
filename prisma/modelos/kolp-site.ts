// Modelo KOLP — "Site e presença digital". Criação (valor único) + manutenção
// e hospedagem mensais. Voz KOLP: estúdio digital, direto e orientado a design.
//
// ATENÇÃO: os números da seção "sobre" (projetos entregues, anos de atuação,
// clientes etc.) são VALORES DE EXEMPLO, editáveis depois pela usuária. Ajuste
// para a realidade da KOLP antes de enviar a proposta.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "projeto", tipo: "texto", rotulo: "Nome do projeto/site", padrao: "Novo site", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do escopo",
    padrao: "Descreva em poucas linhas o que o site precisa resolver: páginas principais, integrações e referências visuais.",
  },
  { id: "paginas", tipo: "numero", rotulo: "Páginas/telas", padrao: 8, min: 1, max: 999, largura: "meia" },
  { id: "criacao", tipo: "moeda", rotulo: "Criação do site (R$, único)", padrao: 6000, passo: 100, largura: "meia" },
  { id: "mensalidade", tipo: "moeda", rotulo: "Manutenção e hospedagem (R$/mês)", padrao: 290, passo: 10 },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Prazo de entrega)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos. Se nenhum estiver completo, a seção Observações não é exibida.",
  },
];

const precificacao: Precificacao = {
  recorrente: { base: { campo: "mensalidade" } },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "criacao", rotulo: "Criação do site (única)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Site e presença digital",
    titulo: "Seu site,\nsob medida",
    tagline: "Design, tecnologia e resultado para **{{cliente}}**",
    selos: [
      { icone: "monitor", texto: "{{projeto}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Um site exclusivo, pensado para o seu negócio — não um modelo pronto.",
    destaque: "Criamos e mantemos no ar.",
    cards: [
      { icone: "pen", titulo: "Design sob medida", texto: "Identidade visual aplicada em cada tela, sem templates genéricos." },
      { icone: "rocket", titulo: "Performance e SEO", texto: "Site rápido, responsivo e pronto para ser encontrado no Google." },
      { icone: "refresh", titulo: "Evolução contínua", texto: "Manutenção, hospedagem e ajustes todo mês, sem dor de cabeça." },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a KOLP",
    numero: "01",
    titulo: "Quem é a KOLP?",
    paragrafos: [
      "Somos um estúdio de tecnologia digital que une **design e código** para criar produtos que as pessoas gostam de usar.",
      "Trabalhamos lado a lado com cada cliente, do primeiro rascunho ao site no ar, com foco em clareza, velocidade e resultado.",
    ],
    numeros: [
      { valor: 2019, formato: "simples", rotulo: "no mercado desde" },
      { valor: 120, sufixo: "+", rotulo: "projetos entregues" },
      { valor: 60, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 100, sufixo: "%", rotulo: "projetos sob medida" },
    ],
    valoresTitulo: "O que guia o nosso trabalho todos os dias",
    letras: "KOLP",
    valores: [
      { palavra: "Clareza", texto: "Comunicação direta, sem jargão, do orçamento à entrega." },
      { palavra: "Originalidade", texto: "Cada projeto nasce do zero, com a cara do seu negócio." },
      { palavra: "Liberdade", texto: "Sem fidelidade engessada: você fica porque quer ficar." },
      { palavra: "Precisão", texto: "Design e código afinados até o último detalhe." },
    ],
  },
  {
    id: "pacotes",
    tipo: "planos",
    capitulo: "Pacotes",
    numero: "02",
    titulo: "Pacotes de criação",
    subtitulo: "Escolha o ponto de partida ideal para o **{{projeto}}**. Os valores finais desta proposta estão na seção Investimento.",
    planos: [
      {
        nome: "Institucional",
        preco: "a partir de R$ 6.000",
        periodo: "valor único",
        descricao: "Para empresas que precisam de presença profissional e objetiva.",
        itens: ["Até 6 páginas", "Design sob medida", "Responsivo (celular e desktop)", "SEO básico", "Formulário de contato"],
      },
      {
        nome: "Profissional",
        preco: "a partir de R$ 9.500",
        periodo: "valor único",
        descricao: "Para quem quer um site completo, com blog e mais recursos.",
        itens: ["Até 12 páginas", "Design sob medida", "Blog/notícias", "SEO avançado", "Integrações (CRM, analytics)", "Painel para editar conteúdo"],
        destaque: true,
        selo: "Mais escolhido",
      },
      {
        nome: "Loja & sistema",
        preco: "sob consulta",
        periodo: "valor único",
        descricao: "Para e-commerce ou funcionalidades personalizadas.",
        itens: ["Páginas ilimitadas", "Catálogo e carrinho", "Pagamento online", "Integrações sob medida", "Área do cliente"],
      },
    ],
    nota: "Pacotes ilustrativos. A configuração e o valor desta proposta são os definidos na seção Investimento.",
  },
  {
    id: "diferenciais",
    tipo: "comparativo",
    capitulo: "Diferenciais",
    numero: "03",
    titulo: "Por que a KOLP",
    rotuloMercado: "Site comum de mercado",
    itens: [
      { icone: "pen", titulo: "Design", nosso: "Criado do zero, com a identidade do seu negócio", mercado: "Template pronto, igual ao de muitos concorrentes" },
      { icone: "bolt", titulo: "Performance", nosso: "Carregamento rápido e otimizado", mercado: "Páginas pesadas e lentas" },
      { icone: "globe", titulo: "SEO", nosso: "Estrutura pensada para aparecer no Google", mercado: "SEO deixado de lado" },
      { icone: "refresh", titulo: "Pós-entrega", nosso: "Manutenção e evolução todo mês", mercado: "Site entregue e abandonado" },
      { icone: "headset", titulo: "Suporte", nosso: "Atendimento direto com quem fez o projeto", mercado: "Chamado em fila, sem retorno" },
    ],
  },
  {
    id: "escopo-tecnico",
    tipo: "especificacoes",
    capitulo: "A solução",
    numero: "04",
    eyebrow: "Proposta",
    titulo: "O que está incluído",
    subtitulo: "Tudo pronto para o {{projeto}} ir ao ar",
    texto: "Entregamos o **{{projeto}}** completo: design exclusivo, código próprio e tudo configurado para publicar. Depois, cuidamos da hospedagem e da manutenção mês a mês. {{escopo}}",
    tituloTabela: "Escopo da entrega",
    selo: "{{projeto}}",
    nota: "Criação (valor único) + manutenção e hospedagem mensais.",
    linhas: [
      { rotulo: "Páginas/telas", valor: "{{paginas}} páginas" },
      { rotulo: "Design", valor: "Sob medida, responsivo" },
      { rotulo: "SEO", valor: "Otimização de busca inclusa" },
      { rotulo: "Hospedagem", valor: "Inclusa na mensalidade" },
      { rotulo: "Certificado SSL", valor: "Incluso (cadeado de segurança)" },
      { rotulo: "Manutenção", valor: "Ajustes e atualizações mensais" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "05",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Manutenção e hospedagem",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais",
      aviso: { icone: "heart", titulo: "Sem fidelidade engessada.", texto: "Você permanece pela qualidade da entrega, não por contrato." },
    },
    unico: {
      titulo: "Criação do site",
      intro: "O que compõe a criação do {{projeto}}:",
      rotulo: "Investimento único",
      itens: [
        { icone: "pen", titulo: "Design exclusivo", texto: "Layout criado do zero, com a identidade visual do seu negócio aplicada em cada tela." },
        { icone: "rocket", titulo: "Desenvolvimento e publicação", texto: "Site construído, testado e colocado no ar, com SSL e otimização de busca." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "06",
    titulo: "O que você ganha",
    blocos: [
      {
        estilo: "grade",
        titulo: "Benefícios de ter o site com a KOLP",
        itens: [
          { icone: "monitor", titulo: "Presença profissional", texto: "Um site que passa confiança desde o primeiro clique." },
          { icone: "globe", titulo: "Encontrado no Google", texto: "Estrutura e SEO para atrair mais visitantes." },
          { icone: "bolt", titulo: "Rápido em qualquer tela", texto: "Experiência fluida no celular e no computador." },
          { icone: "shield", titulo: "Seguro e no ar", texto: "Hospedagem, SSL e monitoramento inclusos." },
          { icone: "money", titulo: "Custo previsível", texto: "Valor fixo mensal, sem surpresas." },
        ],
      },
    ],
  },
  {
    id: "cronograma",
    tipo: "cronograma",
    capitulo: "Cronograma",
    numero: "07",
    titulo: "Como vamos trabalhar",
    etapas: [
      { icone: "pen", titulo: "Briefing", texto: "Entendemos o seu negócio, o público e as referências do {{projeto}}." },
      { icone: "monitor", titulo: "Design", texto: "Criamos o layout sob medida e ajustamos com você." },
      { icone: "gear", titulo: "Desenvolvimento", texto: "Transformamos o design em site rápido e responsivo." },
      { icone: "rocket", titulo: "Publicação", texto: "Colocamos o site no ar, com SSL e otimização de busca." },
      { icone: "refresh", titulo: "Manutenção", texto: "A partir daí, cuidamos da hospedagem e da evolução mês a mês." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos tirar o {{projeto}} do papel?",
    botao: "Quero seguir com esta proposta",
    site: "KOLP.COM.BR",
  },
];

export const modeloKolpSite: ModeloDef = {
  nome: "Site e presença digital",
  descricao: "Criação de site (produto exclusivo, valor único) com manutenção e hospedagem mensais.",
  tipoSolucao: "site",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
