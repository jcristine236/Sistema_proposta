// Modelo CADDI — "Servidor em nuvem". Construído a partir do mockup aprovado.
// Para alterar textos, ordem de seções ou campos, edite este arquivo e rode o seed
// novamente (ou edite pelo painel quando o editor visual estiver pronto).

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";

export const PLANOS_NUVEM = [
  { codigo: "basico", nome: "Básico", preco: 1148, atributos: { vcpu: 12, ram: 32, disco: 500 } },
  { codigo: "intermediario", nome: "Intermediário", preco: 1368, atributos: { vcpu: 12, ram: 64, disco: 500 } },
  { codigo: "avancado", nome: "Avançado", preco: 1668, atributos: { vcpu: 16, ram: 92, disco: 1000 } },
  { codigo: "auge", nome: "Auge", preco: 1998, atributos: { vcpu: 20, ram: 128, disco: 1500 } },
];

export const campos: Campo[] = [
  { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
  {
    id: "plano",
    tipo: "produto",
    rotulo: "Plano",
    categoria: "planos-nuvem",
    padrao: "avancado",
    obrigatorio: true,
    personalizado: {
      rotulo: "Personalizado (você define preço e configuração)",
      atributos: [
        { id: "vcpu", rotulo: "vCPUs" },
        { id: "ram", rotulo: "Memória RAM (GB)" },
        { id: "disco", rotulo: "Armazenamento (GB)" },
      ],
      nota: "Os campos começam com os valores do último plano escolhido. Os 5 dispositivos inclusos e o adicional de R$ 30,00 continuam valendo.",
    },
  },
  { id: "dispositivos", tipo: "numero", rotulo: "Dispositivos acessantes", min: 0, max: 999, padrao: 5, largura: "meia", ajuda: "5 inclusos. Adicionais: R$ 30,00 cada." },
  { id: "implantacao", tipo: "moeda", rotulo: "Taxa de implantação (R$)", padrao: 960, passo: 10, largura: "meia" },
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

export const precificacao: Precificacao = {
  recorrente: {
    base: { campo: "plano" },
    adicionais: [
      {
        campo: "dispositivos",
        inclusos: 5,
        valorUnitario: 30,
        rotuloSingular: "dispositivo adicional",
        rotuloPlural: "dispositivos adicionais",
        rotuloLinha: "Dispositivos acessantes",
        unidade: ["dispositivo", "dispositivos"],
      },
    ],
  },
  desconto: { campo: "desconto", limitePct: 15 },
  unicos: [{ campo: "implantacao", rotulo: "Taxa de implantação (única)" }],
};

export const secoes: Secao[] = [
  {
    id: "capa",
    tipo: "capa",
    capitulo: "Início",
    eyebrow: "Proposta comercial · Servidor em nuvem",
    titulo: "Proposta\nComercial",
    tagline: "Mais de 11 anos de inovação e confiança",
    selos: [
      { icone: "cloud", texto: "Plano {{plano.nome}}" },
      { icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" },
    ],
  },
  {
    id: "ponto-de-partida",
    tipo: "abertura",
    capitulo: "Abertura",
    chamada: "O que faremos por **{{cliente}}**",
    titulo: "Imagine não ter que se preocupar com servidor, acessos e configurações.",
    destaque: "Isso é com a gente.",
    cards: [
      { icone: "cloud", titulo: "Hospedamos seu servidor", texto: "na nuvem CADDI, sem equipamento local" },
      { icone: "users", titulo: "Gerimos acessos e configurações", texto: "usuários, permissões e atualizações" },
      { icone: "headset", titulo: "Um time que entende de você", texto: "técnica, operação e a sua rotina" },
    ],
  },
  {
    id: "quem-somos",
    tipo: "sobre",
    capitulo: "Quem é a CADDI",
    numero: "01",
    titulo: "Quem é a CADDI?",
    paragrafos: [
      "Desde 2015 cuidamos da infraestrutura de TI de empresas de diversos segmentos, acompanhando de perto a rotina de cada uma para que a tecnologia nunca seja um obstáculo.",
      "Nosso propósito é ser o parceiro de tecnologia que sua empresa merece ter, com atendimento humanizado, infraestrutura confiável e um time que conhece de perto a operação de cada cliente.",
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
    id: "confianca",
    tipo: "confianca",
    capitulo: "Confiança",
    numero: "02",
    titulo: "Confiança",
    ilustracao: "datacenter",
    paragrafos: [
      "A CADDI possui infraestrutura própria em data centers Tier III, garantindo **disponibilidade global e segurança**.",
      "Com certificações internacionais, nossa operação é sustentável, utilizando **energia 100% renovável** e atingindo um padrão de **Carbono Neutro**.",
    ],
    grupos: [
      {
        nome: "Infraestrutura",
        selos: [
          { sigla: "TIER", codigo: "III", descricao: "Design (Uptime Institute)" },
          { sigla: "TIER", codigo: "III", descricao: "Facility (Uptime Institute)" },
          { sigla: "TR3", codigo: "TÜV", descricao: "TÜV Rheinland · ANSI/TIA-942" },
          { sigla: "PCI", codigo: "DSS", descricao: "Transações financeiras" },
          { sigla: "SOC", codigo: "SOC", descricao: "Segurança física e processos" },
          { sigla: "TIA", codigo: "942-C", descricao: "Rated 3 Design (EPI)" },
          { sigla: "TIA", codigo: "942-C", descricao: "Rated 3 Constructed Facility (TÜV)" },
        ],
      },
      {
        nome: "Qualidade",
        selos: [
          { sigla: "ISO", codigo: "9001", descricao: "Gestão de qualidade" },
          { sigla: "ISO", codigo: "20000", descricao: "Gestão de serviços de TI" },
        ],
      },
      {
        nome: "Segurança",
        selos: [
          { sigla: "ISO", codigo: "27001", descricao: "Gestão da segurança da informação" },
          { sigla: "ISO", codigo: "27701", descricao: "Gestão da privacidade dos dados" },
        ],
      },
      {
        nome: "ESG",
        selos: [
          { sigla: "ISO", codigo: "14001", descricao: "Gestão ambiental" },
          { sigla: "ISO", codigo: "22301", descricao: "Continuidade dos negócios" },
          { sigla: "ISO", codigo: "37001", descricao: "Antissuborno (em certificação)" },
          { sigla: "ISO", codigo: "37301", descricao: "Compliance" },
          { sigla: "ISO", codigo: "45001", descricao: "Segurança e saúde ocupacional" },
          { sigla: "ISO", codigo: "50001", descricao: "Eficiência energética" },
          { sigla: "CO₂", codigo: "neutro", descricao: "Carbono Neutro" },
        ],
      },
    ],
  },
  {
    id: "ecossistema",
    tipo: "marcas",
    capitulo: "Ecossistema",
    titulo: "Nosso ecossistema de conectividade",
    itens: ["Fortinet", "Huawei", "SolarWinds", "Microsoft", "SentinelOne", "VMware", "Dell", "Cisco", "Bitdefender", "Veeam"],
  },
  {
    id: "diferenciais",
    tipo: "comparativo",
    capitulo: "Diferenciais",
    numero: "03",
    titulo: "Diferenciais CADDI",
    rotuloMercado: "Mercado tradicional",
    itens: [
      { icone: "target", titulo: "Especialidade", nosso: "Time que aprende a rotina e as prioridades do seu negócio", mercado: "TI genérica, mesmo tratamento para qualquer segmento" },
      { icone: "server", titulo: "Equipamentos", nosso: "Infraestrutura atualizada e renovada continuamente", mercado: "Hardware antigo, sem plano de atualização" },
      { icone: "bolt", titulo: "Performance", nosso: "Ambiente dimensionado para alta performance", mercado: "Performance instável, sem dimensionamento" },
      { icone: "shield", titulo: "Segurança", nosso: "Backup, EDR e licenciamento oficial, sempre ativos", mercado: "Segurança tratada como item opcional" },
      { icone: "headset", titulo: "Suporte", nosso: "100% humano, time dedicado por cliente", mercado: "Central genérica, bots e filas" },
      { icone: "pen", titulo: "Contrato", nosso: "Sem multa contratual", mercado: "Fidelidade obrigatória com multa" },
    ],
  },
  {
    id: "solucao",
    tipo: "especificacoes",
    capitulo: "A solução",
    numero: "04",
    eyebrow: "Proposta",
    titulo: "Solução de servidor em nuvem",
    subtitulo: "Escalabilidade e segurança",
    texto:
      "A solução proposta oferece escalabilidade para atender às crescentes demandas do **{{cliente}}**. Com um servidor de arquivos e pastas, garantimos alta disponibilidade e segurança, permitindo que a equipe se concentre nas atividades essenciais sem preocupações com a infraestrutura.",
    tituloTabela: "Configurações técnicas",
    selo: "Plano {{plano.nome}}",
    nota: "Recursos + licenças inclusas no pacote",
    linhas: [
      { rotulo: "Processamento", valor: "{{plano.vcpu}} vCPUs" },
      { rotulo: "Memória RAM", valor: "{{plano.ram}} GB" },
      { rotulo: "Armazenamento", valor: "{{plano.disco}} GB" },
      { rotulo: "Agente de acesso ao ambiente de dados", valor: "{{dispositivos}} dispositivos" },
      { rotulo: "Licença EDR (proteção do ambiente)", valor: "1 licença" },
      { rotulo: "Windows Server", valor: "Incluso" },
      { rotulo: "Agente de backup", valor: "Incluso. Pacote de {{plano.disco}} GB" },
      { rotulo: "Tipo de backup", valor: "Backup: 2x por dia\nRecuperação: Últimos 30 dias" },
    ],
  },
  {
    id: "investimento",
    tipo: "investimento",
    capitulo: "Investimento",
    numero: "05",
    titulo: "Condições comerciais",
    recorrente: {
      titulo: "Servidor em nuvem",
      rotuloTotal: "Investimento mensal",
      rodapeTotal: "por mês, em reais, valor fixo",
      aviso: { icone: "shield", titulo: "Sem multa contratual.", texto: 'Nossa retenção é relacionamento e resultado, não contrato "engessado".' },
    },
    unico: {
      titulo: "Taxa de implantação",
      intro: "O que compõe o processo de implantação:",
      rotulo: "Investimento único",
      itens: [
        { icone: "upload", titulo: "Migração completa dos dados", texto: "Do servidor atual para a nuvem CADDI, garantindo integridade e continuidade das informações." },
        { icone: "key", titulo: "Configuração de acessos", texto: "Criamos os usuários (AD) com as permissões adequadas para que sua equipe já inicie com tudo funcionando." },
      ],
    },
    observacoes: { titulo: "Observações" },
  },
  {
    id: "resultados",
    tipo: "resultados",
    capitulo: "Resultados",
    numero: "06",
    titulo: "Resultados e projeções",
    blocos: [
      {
        estilo: "lista",
        titulo: "O que sua empresa passa a ter",
        itens: [
          { icone: "cloud", titulo: "Infraestrutura pronta para operar", texto: "Armazenamento, processamento e conectividade dimensionados para o seu ambiente." },
          { icone: "monitor", titulo: "Monitoramento contínuo e proativo", texto: "Alertas antes que problemas afetem sua operação." },
          { icone: "headset", titulo: "Suporte técnico humanizado", texto: "Nossa equipe pronta para agir quando algo precisar de atenção." },
        ],
      },
      {
        estilo: "checks",
        titulo: "Gestão do ambiente, inclusa no plano",
        itens: [
          "Administração do Active Directory (AD): criação, alteração e remoção de usuários e permissões",
          "Instalação e atualização de patches de segurança",
          "Monitoramento NOC (Centro de Operações de Rede)",
        ],
        nota: "Nosso grande diferencial é garantir que a infraestrutura permaneça atualizada e funcionando corretamente, com mais segurança e continuidade para a sua operação.",
      },
      {
        estilo: "grade",
        titulo: "Benefícios de estar no servidor em nuvem CADDI",
        itens: [
          { icone: "server", titulo: "Sem servidor físico", texto: "Sem investir em servidores locais." },
          { icone: "globe", titulo: "Mobilidade", texto: "Acesse de qualquer lugar, com performance e segurança." },
          { icone: "plug", titulo: "Sem manutenção", texto: "Sem gastos com hardware e nobreaks." },
          { icone: "snow", titulo: "Mais economia", texto: "Menos gasto com energia e climatização." },
          { icone: "money", titulo: "Previsibilidade", texto: "Valor fixo mensal, em reais." },
        ],
      },
    ],
  },
  {
    id: "cronograma",
    tipo: "cronograma",
    capitulo: "Cronograma",
    numero: "07",
    titulo: "Cronograma de implantação",
    etapas: [
      { icone: "pen", titulo: "Assinatura", texto: "O processo começa com a assinatura digital do contrato." },
      { icone: "flag", titulo: "Kickoff", texto: "Em seguida, realizamos o kickoff técnico para definir as etapas." },
      { icone: "gear", titulo: "Configuração", texto: "A criação do ambiente e a configuração de acessos são ajustadas para todos os usuários." },
      { icone: "upload", titulo: "Migração", texto: "A migração de dados para a nuvem é feita de forma segura." },
      { icone: "shield", titulo: "Validação", texto: "Após a migração, validamos o ambiente para garantir a funcionalidade." },
      { icone: "rocket", titulo: "Entrega", texto: "Ambiente pronto, com sua equipe operando na nuvem CADDI." },
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

export const modeloCaddiNuvem = {
  nome: "Servidor em nuvem",
  descricao: "Proposta de servidor em nuvem com planos, dispositivos adicionais, desconto com limite de aprovação e taxa de implantação.",
  tipoSolucao: "servidor-nuvem",
  validadeDias: 15,
  campos,
  secoes,
  precificacao,
};
