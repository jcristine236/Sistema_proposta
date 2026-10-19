// Modelo CADDI — "Gestão e Suporte de TI". Espelha a proposta comercial real da
// CADDI ("Solução Completa de Gestão e Suporte de Tecnologia da Informação"):
// gestão de TI orientada à excelência operacional, organizada em três pilares
// (Gestão, Suporte e Assessoria), com mensalidade fixa e sem taxa de implantação.
// Para alterar textos, ordem de seções ou campos, edite este arquivo e rode o
// seed novamente.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "escopo",
    tipo: "textoLongo",
    rotulo: "Objetivo da gestão de TI",
    padrao:
      "Prover uma gestão de TI orientada à excelência operacional, assegurando **disponibilidade, segurança, governança e desempenho** do ambiente tecnológico. Nosso objetivo é minimizar impactos operacionais, maximizar a produtividade e oferecer uma base tecnológica confiável para sustentar as operações e o crescimento da empresa.",
    ajuda: "Descreve o objetivo da gestão de TI. Este texto aparece na seção de escopo da proposta.",
  },
  { id: "servidores", tipo: "numero", rotulo: "Servidores gerenciados", min: 0, max: 999, padrao: 1, largura: "meia" },
  { id: "estacoes", tipo: "numero", rotulo: "Estações gerenciadas", min: 1, max: 999, padrao: 6, largura: "meia", ajuda: "Inclui monitoramento e suporte." },
  { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade (R$)", padrao: 550, passo: 50 },
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
  recorrente: {
    base: { campo: "mensalidade" },
  },
  desconto: { campo: "desconto", limitePct: 15 },
};

const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Gestão e Suporte de TI",
    titulo: "Proposta\nComercial",
    tagline: "Mais de 11 anos de inovação e confiança",
    selos: [
      { icone: "headset", texto: "Gestão e Suporte de TI" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Imagine ter um ambiente de TI estável, seguro e acompanhado todos os dias.",
    destaque: "Isso é com a gente.",
    cards: [
      { icone: "shield", titulo: "Gestão orientada à excelência", texto: "disponibilidade, segurança, governança e desempenho" },
      { icone: "headset", titulo: "Suporte sem burocracia", texto: "chamados remotos ilimitados e atendimento humanizado" },
      { icone: "target", titulo: "Assessoria estratégica", texto: "avaliação da infraestrutura e apoio à decisão" },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a CADDI",
    numero: "01",
    titulo: "Quem é a CADDI?",
    paragrafos: [
      "A CADDI é especializada em **gestão de TI, infraestrutura de servidores em nuvem e suporte técnico** para empresas que precisam de um parceiro de tecnologia confiável, sem a necessidade de manter uma equipe interna de TI.",
      "Atuamos com foco especial em **escritórios de contabilidade e empresas de serviços**, que dependem de sistemas estáveis e de um ambiente seguro para operar com tranquilidade.",
    ],
    numeros: [
      { valor: 2015, formato: "simples", rotulo: "cuidando de TI desde" },
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
    id: "escopo",
    tipo: "especificacoes",
    capitulo: "Escopo",
    numero: "02",
    eyebrow: "Proposta",
    titulo: "Escopo de cobertura",
    subtitulo: "O ambiente que entra na gestão",
    texto: "{{escopo}}",
    tituloTabela: "Recursos gerenciados",
    selo: "{{servidores}} servidor(es) · {{estacoes}} estações",
    nota: "Gestão, suporte e assessoria inclusos na mensalidade",
    linhas: [
      { rotulo: "Servidores gerenciados", valor: "{{servidores}}" },
      { rotulo: "Estações gerenciadas", valor: "{{estacoes}}" },
      { rotulo: "Monitoramento ativo", valor: "Dispositivos gerenciados, com alertas proativos" },
      { rotulo: "Chamados via acesso remoto", valor: "Ilimitados" },
    ],
  },
  {
    id: "o-que-fazemos",
    tipo: "resultados",
    capitulo: "O que fazemos",
    numero: "03",
    titulo: "O que fazemos por você",
    blocos: [
      {
        estilo: "checks",
        titulo: "Gestão",
        itens: [
          "Gestão de acessos e permissões — criação, alteração e revogação de usuários conforme a necessidade da empresa",
          "Gestão de senhas e políticas de segurança, reduzindo riscos de acesso indevido",
          "Acompanhamento de rotinas de backup, com verificação de execução e integridade",
          "Gestão de atualizações e patches de segurança em servidores",
          "Controle de licenças de software, evitando vencimentos e irregularidades",
          "Inventário de ativos de TI, atualizado e entregue periodicamente",
          "Monitoramento ativo dos dispositivos gerenciados, com alertas antes que o problema afete a operação",
          "Governança do ambiente, promovendo organização, segurança e continuidade dos serviços",
        ],
        nota: "Nossa atuação é organizada em três pilares, que juntos garantem um ambiente de TI estável, seguro e alinhado ao crescimento da sua empresa.",
      },
      {
        estilo: "lista",
        titulo: "Suporte",
        itens: [
          { icone: "headset", titulo: "Chamados remotos ilimitados", texto: "Atendimento via acesso remoto com ferramenta homologada e segura." },
          { icone: "bolt", titulo: "Abertura sem burocracia", texto: "Você abre o chamado e nós resolvemos, sem etapas desnecessárias." },
          { icone: "heart", titulo: "Atendimento humanizado", texto: "Sempre na linguagem do cliente, com relacionamento próximo." },
          { icone: "shield", titulo: "Orientação em cibersegurança", texto: "Boas práticas para os usuários, reduzindo erros humanos." },
        ],
      },
      {
        estilo: "grade",
        titulo: "Assessoria",
        itens: [
          { icone: "monitor", titulo: "Avaliação periódica", texto: "Identificamos riscos, gargalos e oportunidades de melhoria na infraestrutura." },
          { icone: "lock", titulo: "Boas práticas", texto: "Orientação sobre segurança da informação." },
          { icone: "refresh", titulo: "Upgrades e renovação", texto: "Recomendações estratégicas para equipamentos e otimização de custos." },
          { icone: "target", titulo: "Apoio à decisão", texto: "Visão técnica alinhada antes de qualquer investimento em TI." },
        ],
      },
    ],
  },
  {
    id: "diferenciais",
    tipo: "comparativo",
    capitulo: "Diferenciais",
    numero: "04",
    titulo: "Diferenciais do nosso atendimento",
    rotuloMercado: "Mercado tradicional",
    itens: [
      { icone: "clock", titulo: "SLA prioritário", nosso: "Atendimento rápido e personalizado, com SLA prioritário conforme a criticidade", mercado: "Fila única, sem prioridade por urgência" },
      { icone: "users", titulo: "Equipe certificada", nosso: "Time técnico certificado e especializado", mercado: "Atendimento genérico, sem especialização" },
      { icone: "heart", titulo: "Suporte humanizado", nosso: "Foco na experiência do usuário, falando a linguagem do cliente", mercado: "Central genérica, bots e filas" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "05",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Gestão e Suporte de TI",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, valor fixo",
      aviso: { icone: "shield", titulo: "Sem multa contratual.", texto: 'Nossa retenção é relacionamento e resultado, não contrato "engessado".' },
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "nao-incluso",
    tipo: "texto",
    capitulo: "Escopo",
    numero: "06",
    eyebrow: "Itens não contemplados",
    titulo: "O que não está incluso",
    paragrafos: [
      "Não estão inclusos neste orçamento, salvo quando expressamente especificados:",
      "**Peças e componentes** — fornecimento ou substituição.",
      "**Equipamentos e licenças** — aquisição de equipamentos, periféricos ou licenças de software.",
      "**Treinamentos** — cursos, treinamentos ou capacitações de usuários.",
      "**Visitas presenciais** — visitas técnicas, deslocamentos e despesas relacionadas.",
      "Caso haja necessidade de qualquer um dos itens acima, será apresentada uma **proposta comercial complementar** para aprovação prévia do contratante.",
    ],
  },
  {
    id: "fechamento",
    tipo: "fechamento",
    capitulo: "Vamos começar?",
    titulo: "Vamos crescer juntos?",
    botao: "Quero seguir com esta proposta",
    site: "CADDI.COM.BR",
  },
];

export const modeloCaddiGestaoTi: ModeloDef = {
  nome: "Gestão e Suporte de TI",
  descricao: "Solução completa de gestão e suporte de TI: gestão, suporte e assessoria em mensalidade fixa, com escopo de cobertura por servidores e estações e desconto com limite de aprovação.",
  tipoSolucao: "gestao-ti",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
