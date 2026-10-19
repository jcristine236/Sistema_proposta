// Modelo KOLP — "Plataforma SaaS". Assinatura mensal por usuário, com setup
// inicial. Voz KOLP: estúdio de tecnologia digital, direto e orientado a design.
//
// ATENÇÃO: os números da seção "sobre" (clientes, anos de atuação, uptime etc.)
// são VALORES DE EXEMPLO, editáveis depois pela usuária. Ajuste para a realidade
// da KOLP antes de enviar a proposta.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  { id: "produto", tipo: "texto", rotulo: "Nome da plataforma", padrao: "Plataforma KOLP", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Resumo do escopo",
    padrao: "Descreva em poucas linhas o que a plataforma resolve e os principais módulos de uso.",
  },
  { id: "mensalidade", tipo: "moeda", rotulo: "Assinatura mensal (R$)", padrao: 490, passo: 10 },
  { id: "usuarios", tipo: "numero", rotulo: "Usuários inclusos", padrao: 5, min: 1, max: 999, largura: "meia", ajuda: "5 inclusos. Adicionais: R$ 29,00 cada." },
  { id: "setup", tipo: "moeda", rotulo: "Setup / implantação (R$)", padrao: 1200, passo: 100, largura: "meia" },
  { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 15 },
  { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
  {
    id: "observacoes",
    tipo: "lista",
    rotulo: "Observações personalizadas (opcional)",
    max: 8,
    rotuloTitulo: "Título (ex.: Prazo de contrato)",
    rotuloDescricao: "Descrição",
    ajuda: "Só aparecem na proposta os itens com título e descrição preenchidos. Se nenhum estiver completo, a seção Observações não é exibida.",
  },
];

const precificacao: Precificacao = {
  recorrente: {
    base: { campo: "mensalidade" },
    adicionais: [
      {
        campo: "usuarios",
        inclusos: 5,
        valorUnitario: 29,
        rotuloSingular: "usuário adicional",
        rotuloPlural: "usuários adicionais",
        rotuloLinha: "Usuários",
        unidade: ["usuário", "usuários"],
      },
    ],
  },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "setup", rotulo: "Setup / implantação (único)" }],
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Plataforma SaaS",
    titulo: "Sua operação,\nem uma plataforma",
    tagline: "Tecnologia sob assinatura para **{{cliente}}**",
    selos: [
      { icone: "cloud", texto: "{{produto}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "abertura",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Uma plataforma pronta para usar, que cresce junto com o seu time.",
    destaque: "Sem servidor, sem dor de cabeça.",
    cards: [
      { icone: "cloud", titulo: "Acesso de qualquer lugar", texto: "A {{produto}} roda na nuvem, pelo navegador, sem instalação." },
      { icone: "users", titulo: "Por usuário", texto: "Comece com a equipe que precisa e adicione pessoas quando quiser." },
      { icone: "shield", titulo: "Atualizações inclusas", texto: "Melhorias, segurança e suporte fazem parte da assinatura." },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a KOLP",
    numero: "01",
    titulo: "Quem é a KOLP?",
    paragrafos: [
      "Somos um estúdio de tecnologia digital que cria e opera **plataformas sob medida**, unindo design e engenharia.",
      "Mais do que entregar um software, cuidamos dele no dia a dia: evolução, estabilidade e suporte próximo.",
    ],
    numeros: [
      { valor: 2019, formato: "simples", rotulo: "no mercado desde" },
      { valor: 60, sufixo: "+", rotulo: "clientes atendidos" },
      { valor: 99, sufixo: "%", rotulo: "de disponibilidade" },
      { valor: 8000, rotulo: "usuários nas nossas plataformas" },
    ],
    valoresTitulo: "O que guia o nosso trabalho todos os dias",
    letras: "KOLP",
    valores: [
      { palavra: "Clareza", texto: "Planos e cobranças transparentes, sem letras miúdas." },
      { palavra: "Originalidade", texto: "Produtos pensados para o seu fluxo de trabalho." },
      { palavra: "Liberdade", texto: "Sem fidelidade engessada: você fica porque vale a pena." },
      { palavra: "Precisão", texto: "Plataforma estável, rápida e bem acabada." },
    ],
  },
  {
    id: "planos",
    tipo: "planos",
    capitulo: "Planos",
    numero: "02",
    titulo: "Planos da plataforma",
    subtitulo: "Escolha o ponto de partida para a **{{produto}}**. Os valores desta proposta estão na seção Investimento.",
    planos: [
      {
        nome: "Starter",
        preco: "a partir de R$ 490",
        periodo: "por mês",
        descricao: "Para times pequenos que estão começando.",
        itens: ["Até 5 usuários", "Módulos essenciais", "Suporte por e-mail", "Atualizações inclusas"],
      },
      {
        nome: "Pro",
        preco: "a partir de R$ 990",
        periodo: "por mês",
        descricao: "Para empresas em crescimento que precisam de mais.",
        itens: ["Usuários adicionais", "Todos os módulos", "Integrações", "Suporte prioritário", "Relatórios avançados"],
        destaque: true,
        selo: "Mais escolhido",
      },
      {
        nome: "Enterprise",
        preco: "sob consulta",
        periodo: "por mês",
        descricao: "Para operações com necessidades específicas.",
        itens: ["Usuários ilimitados", "Customizações sob medida", "SLA dedicado", "Onboarding assistido", "Gerente de conta"],
      },
    ],
    nota: "Planos ilustrativos. A configuração e o valor desta proposta são os definidos na seção Investimento.",
  },
  {
    id: "recursos",
    tipo: "especificacoes",
    capitulo: "A solução",
    numero: "03",
    eyebrow: "Proposta",
    titulo: "O que está incluído",
    subtitulo: "Tudo que a {{produto}} entrega na assinatura",
    texto: "A **{{produto}}** é entregue como serviço: você acessa pelo navegador e nós cuidamos de hospedagem, segurança e evolução. {{escopo}}",
    tituloTabela: "Incluso na assinatura",
    selo: "{{produto}}",
    nota: "Assinatura mensal por usuário + setup inicial de implantação.",
    linhas: [
      { rotulo: "Usuários inclusos", valor: "{{usuarios}} usuários" },
      { rotulo: "Acesso", valor: "Pela nuvem, em qualquer navegador" },
      { rotulo: "Atualizações", valor: "Inclusas, sem custo extra" },
      { rotulo: "Segurança", valor: "SSL, backups e controle de acesso" },
      { rotulo: "Suporte", valor: "Atendimento humano da KOLP" },
      { rotulo: "Setup", valor: "Implantação e onboarding iniciais" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "04",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Assinatura da plataforma",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais",
      aviso: { icone: "heart", titulo: "Sem fidelidade engessada.", texto: "Você permanece pela qualidade da plataforma, não por contrato." },
    },
    unico: {
      titulo: "Setup / implantação",
      intro: "O que compõe a implantação da {{produto}}:",
      rotulo: "Investimento único",
      itens: [
        { icone: "gear", titulo: "Configuração inicial", texto: "Preparamos o ambiente, os módulos e as regras de uso da sua operação." },
        { icone: "users", titulo: "Onboarding do time", texto: "Criamos os usuários e orientamos a equipe para já começar usando." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "05",
    titulo: "O que você ganha",
    blocos: [
      {
        estilo: "grade",
        titulo: "Benefícios de usar a {{produto}}",
        itens: [
          { icone: "cloud", titulo: "Sem infraestrutura", texto: "Nada de servidor próprio: tudo roda na nuvem." },
          { icone: "bolt", titulo: "Pronta para usar", texto: "Comece rápido, sem projeto longo de instalação." },
          { icone: "users", titulo: "Cresce com você", texto: "Adicione usuários conforme a necessidade." },
          { icone: "refresh", titulo: "Sempre atualizada", texto: "Novidades e melhorias chegam automaticamente." },
          { icone: "money", titulo: "Custo previsível", texto: "Assinatura mensal clara, em reais." },
        ],
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
      { pergunta: "Como funciona a cobrança por usuário?", resposta: "A assinatura inclui 5 usuários. Cada usuário adicional custa R$ 29,00 por mês, e você só paga pelos que usar." },
      { pergunta: "Preciso instalar algo?", resposta: "Não. A {{produto}} roda na nuvem e é acessada pelo navegador, de qualquer dispositivo." },
      { pergunta: "Tenho fidelidade ou multa?", resposta: "Não trabalhamos com fidelidade engessada. Você permanece pela qualidade da plataforma." },
      { pergunta: "As atualizações têm custo?", resposta: "Não. Melhorias, correções e atualizações de segurança estão inclusas na assinatura." },
      { pergunta: "O setup é cobrado uma vez só?", resposta: "Sim. O setup de implantação é um valor único, cobrado apenas no início do projeto." },
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Pronto para colocar a {{produto}} para rodar?",
    botao: "Quero seguir com esta proposta",
    site: "KOLP.COM.BR",
  },
];

export const modeloKolpSaas: ModeloDef = {
  nome: "Plataforma SaaS",
  descricao: "Assinatura mensal de plataforma SaaS: usuários, setup inicial e desconto.",
  tipoSolucao: "saas",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
