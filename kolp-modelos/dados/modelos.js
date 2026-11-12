/*
  CATÁLOGO KOLP — lista de modelos
  Para publicar um modelo novo: crie a pasta em /demo/<pasta>/ e acrescente um bloco aqui.
  Os filtros do catálogo são montados sozinhos a partir destes dados.
*/

window.KOLP_CONFIG = {
  marca: "KOLP",
  whatsapp: "5511999999999", // DDI + DDD + número, só dígitos
  mensagem: "Olá! Vi o catálogo da KOLP e quero o modelo {codigo} ({nome})."
};

/* Opções de cada filtro, na ordem em que aparecem. Nichos sem modelo aparecem como "em breve". */
window.KOLP_FILTROS = {
  nicho: ["Advocacia", "Clínica e saúde", "Restaurante", "Contabilidade", "Comércio", "Consultoria", "Serviços", "Imobiliária", "Estética", "Tecnologia"],
  tipo: ["Landing page", "Institucional", "One-page", "Cardápio", "Página de captura", "Portfólio"],
  estilo: ["Tradicional", "Moderno", "Minimalista", "Editorial", "Ousado", "Corporativo"],
  tom: ["Claro", "Escuro", "Quente", "Frio", "Neutro"],
  efeitos: ["Sem efeitos", "Animação ao rolar", "Parallax", "Letreiro animado"],
  objetivo: ["WhatsApp", "Agendamento", "Formulário de contato", "Reserva", "Pedido online"]
};

window.KOLP_MODELOS = [
  {
    codigo: "KOLP-001",
    pasta: "advocacia-01",
    nome: "Monteiro Prado",
    resumo: "Escritório de advocacia com tipografia clássica, áreas de atuação numeradas e apresentação dos sócios.",
    nicho: "Advocacia", tipo: "Institucional", estilo: ["Tradicional"], tom: ["Claro", "Quente"],
    efeitos: ["Sem efeitos"], objetivo: ["Formulário de contato", "WhatsApp"],
    secoes: ["Áreas de atuação", "Números", "Sócios", "Contato"],
    paletas: [
      { nome: "Verde-garrafa", primaria: "#1f3a34", destaque: "#a8823c", fundo: "#f6f2ea", superficie: "#fffdf8", texto: "#1d1d1b" },
      { nome: "Azul-marinho", primaria: "#1b2a4a", destaque: "#b08a4a", fundo: "#f4f2ee", superficie: "#ffffff", texto: "#191b20" },
      { nome: "Bordô", primaria: "#5a1f28", destaque: "#9a7b4f", fundo: "#f7f1ec", superficie: "#fffcf9", texto: "#211a1a" },
      { nome: "Grafite", primaria: "#2b2b2b", destaque: "#8c6d3f", fundo: "#f3f3f0", superficie: "#ffffff", texto: "#1a1a1a" }
    ]
  },
  {
    codigo: "KOLP-002",
    pasta: "clinica-01",
    nome: "Odonto Alameda",
    resumo: "Clínica odontológica com agendamento logo na abertura, lista de tratamentos e perguntas frequentes.",
    nicho: "Clínica e saúde", tipo: "Landing page", estilo: ["Moderno"], tom: ["Claro", "Frio"],
    efeitos: ["Animação ao rolar"], objetivo: ["Agendamento", "WhatsApp"],
    secoes: ["Agendamento", "Tratamentos", "Primeira consulta", "Equipe", "Perguntas frequentes"],
    paletas: [
      { nome: "Verde-água", primaria: "#0f6e6a", destaque: "#f2a65a", fundo: "#f2f7f6", superficie: "#ffffff", texto: "#12292b" },
      { nome: "Azul clínico", primaria: "#1d5fa8", destaque: "#f0b64a", fundo: "#f3f6fa", superficie: "#ffffff", texto: "#14233a" },
      { nome: "Rosa antigo", primaria: "#a8506a", destaque: "#e0a458", fundo: "#faf4f3", superficie: "#ffffff", texto: "#2e1c22" },
      { nome: "Lavanda", primaria: "#5b54a0", destaque: "#e99a6b", fundo: "#f5f4fa", superficie: "#ffffff", texto: "#1f1d33" }
    ]
  },
  {
    codigo: "KOLP-003",
    pasta: "restaurante-01",
    nome: "Cantina Assunta",
    resumo: "Cantina italiana em tom editorial: foto de página inteira, cardápio com preços e reserva pelo WhatsApp.",
    nicho: "Restaurante", tipo: "Cardápio", estilo: ["Editorial", "Tradicional"], tom: ["Quente", "Claro"],
    efeitos: ["Parallax"], objetivo: ["Reserva", "WhatsApp"],
    secoes: ["História", "Cardápio", "Horários", "Reserva"],
    paletas: [
      { nome: "Terracota", primaria: "#9c3d22", destaque: "#56613a", fundo: "#f3e9d8", superficie: "#fbf5ea", texto: "#2a1d15" },
      { nome: "Vinho", primaria: "#6e1f2f", destaque: "#a07a3a", fundo: "#f4ebe1", superficie: "#fcf7f0", texto: "#261619" },
      { nome: "Oliva", primaria: "#4a5a2c", destaque: "#b5552e", fundo: "#f1eddc", superficie: "#faf8ec", texto: "#20231a" },
      { nome: "Carvão", primaria: "#26221f", destaque: "#c0803a", fundo: "#efe9df", superficie: "#f9f5ee", texto: "#1c1917" }
    ]
  },
  {
    codigo: "KOLP-004",
    pasta: "contabilidade-01",
    nome: "Baliza Contabilidade",
    resumo: "Escritório contábil com pedido de proposta, tabela de serviços, planos por regime e calendário fiscal.",
    nicho: "Contabilidade", tipo: "Página de captura", estilo: ["Corporativo", "Moderno"], tom: ["Claro", "Frio"],
    efeitos: ["Sem efeitos"], objetivo: ["Formulário de contato", "WhatsApp"],
    secoes: ["Pedido de proposta", "Serviços", "Planos", "Calendário fiscal", "Depoimento"],
    paletas: [
      { nome: "Marinho e verde", primaria: "#14305a", destaque: "#1f8a5b", fundo: "#f4f5f7", superficie: "#ffffff", texto: "#141a24" },
      { nome: "Petróleo", primaria: "#0f4350", destaque: "#d98a2b", fundo: "#f3f6f6", superficie: "#ffffff", texto: "#10201f" },
      { nome: "Grafite e azul", primaria: "#23272e", destaque: "#2f6fde", fundo: "#f5f5f5", superficie: "#ffffff", texto: "#16181c" },
      { nome: "Verde-floresta", primaria: "#1c4332", destaque: "#b9862f", fundo: "#f4f6f2", superficie: "#ffffff", texto: "#141c17" }
    ]
  },
  {
    codigo: "KOLP-005",
    pasta: "comercio-01",
    nome: "Mercado Sabiá",
    resumo: "Mercado de bairro com cara de encarte: ofertas da semana em etiquetas de preço e pedido pelo WhatsApp.",
    nicho: "Comércio", tipo: "One-page", estilo: ["Ousado"], tom: ["Quente", "Claro"],
    efeitos: ["Letreiro animado"], objetivo: ["Pedido online", "WhatsApp"],
    secoes: ["Ofertas da semana", "Seções da loja", "Como pedir", "Endereço e horário"],
    paletas: [
      { nome: "Tomate e amarelo", primaria: "#e03c22", destaque: "#ffc93c", fundo: "#fff8ea", superficie: "#ffffff", texto: "#1b1a17" },
      { nome: "Verde-feira", primaria: "#1e7a3c", destaque: "#ffd23f", fundo: "#f8f9ec", superficie: "#ffffff", texto: "#162018" },
      { nome: "Azul e laranja", primaria: "#1746a2", destaque: "#ff8a1f", fundo: "#f5f7fc", superficie: "#ffffff", texto: "#14192a" },
      { nome: "Preto e limão", primaria: "#181818", destaque: "#d8f04a", fundo: "#f6f5ef", superficie: "#ffffff", texto: "#181818" }
    ]
  },
  {
    codigo: "KOLP-006",
    pasta: "consultoria-01",
    nome: "Norte Associados",
    resumo: "Consultoria de gestão em layout enxuto: frase de abertura grande, método em etapas e casos com resultado.",
    nicho: "Consultoria", tipo: "Institucional", estilo: ["Minimalista", "Editorial"], tom: ["Claro", "Neutro"],
    efeitos: ["Animação ao rolar"], objetivo: ["Formulário de contato"],
    secoes: ["Frentes de trabalho", "Método", "Casos", "Sócios", "Contato"],
    paletas: [
      { nome: "Preto e ferrugem", primaria: "#1a1a1a", destaque: "#c2552d", fundo: "#fafaf7", superficie: "#ffffff", texto: "#1a1a1a" },
      { nome: "Azul-noite", primaria: "#14233f", destaque: "#3d7fd6", fundo: "#f8f9fb", superficie: "#ffffff", texto: "#131a26" },
      { nome: "Musgo", primaria: "#24332a", destaque: "#8a9a3c", fundo: "#f8f8f3", superficie: "#ffffff", texto: "#1a211c" },
      { nome: "Ameixa", primaria: "#33202e", destaque: "#c0667a", fundo: "#faf7f8", superficie: "#ffffff", texto: "#221a20" }
    ]
  }
];
