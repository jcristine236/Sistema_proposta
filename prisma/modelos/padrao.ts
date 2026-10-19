// Modelo genérico "Proposta comercial" — ponto de partida para KOLP e FASE até
// recebermos o conteúdo específico de cada uma. Usa o tema (cores/logo) da empresa.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";
import type { ModeloDef } from "./tipo";

export function modeloPadrao(empresa: { nome: string; site: string }): ModeloDef {
  const campos: Campo[] = [
    { id: "cliente", tipo: "contato", rotulo: "Nome do cliente", obrigatorio: true },
    { id: "projeto", tipo: "texto", rotulo: "Título do projeto", padrao: "Projeto de tecnologia", obrigatorio: true },
    {
      id: "escopo",
      tipo: "textoLongo",
      rotulo: "Resumo do escopo",
      padrao: "Descreva aqui, em poucas linhas, o que será entregue para o cliente.",
    },
    { id: "mensalidade", tipo: "moeda", rotulo: "Mensalidade (R$)", padrao: 0, largura: "meia" },
    { id: "implantacao", tipo: "moeda", rotulo: "Implantação (R$)", padrao: 0, largura: "meia" },
    { id: "desconto", tipo: "desconto", rotulo: "Desconto", limitePct: 10 },
    { id: "validade", tipo: "data", rotulo: "Proposta válida até", padraoDias: 15 },
    { id: "observacoes", tipo: "lista", rotulo: "Observações (opcional)", max: 8 },
  ];

  const precificacao: Precificacao = {
    recorrente: { base: { campo: "mensalidade" } },
    desconto: { campo: "desconto", limitePct: 10 },
    unicos: [{ campo: "implantacao", rotulo: "Implantação (única)" }],
  };

  const secoes: Secao[] = [
    {
      id: "capa",
      tipo: "capa",
      eyebrow: "Proposta comercial · {{projeto}}",
      titulo: "Proposta\nComercial",
      selos: [{ icone: "calendar", texto: "Válida até {{validade}}", estilo: "validade" }],
    },
    {
      id: "escopo",
      tipo: "texto",
      capitulo: "Escopo",
      numero: "01",
      titulo: "O que vamos entregar",
      paragrafos: ["{{escopo}}"],
    },
    {
      id: "investimento",
      tipo: "investimento",
      capitulo: "Investimento",
      numero: "02",
      titulo: "Condições comerciais",
      recorrente: { titulo: "{{projeto}}", rotuloTotal: "Investimento mensal", rodapeTotal: "por mês, em reais" },
      unico: { titulo: "Implantação", rotulo: "Investimento único", itens: [] },
      observacoes: { titulo: "Observações" },
    },
    {
      id: "cronograma",
      tipo: "cronograma",
      capitulo: "Próximos passos",
      numero: "03",
      titulo: "Próximos passos",
      etapas: [
        { icone: "pen", titulo: "Aceite", texto: "Você aceita a proposta por aqui mesmo." },
        { icone: "flag", titulo: "Kickoff", texto: "Reunião de início para alinhar prazos e responsáveis." },
        { icone: "rocket", titulo: "Entrega", texto: "Execução e acompanhamento até a entrega final." },
      ],
    },
    {
      id: "fechamento",
      tipo: "fechamento",
      capitulo: "Vamos começar?",
      titulo: "Vamos começar?",
      botao: "Quero seguir com esta proposta",
      site: empresa.site.toUpperCase(),
    },
  ];

  return {
    nome: "Proposta comercial",
    descricao: `Modelo inicial da ${empresa.nome}: escopo, mensalidade, implantação e próximos passos.`,
    tipoSolucao: "padrao",
    validadeDias: 15,
    campos,
    secoes,
    precificacao,
  };
}
