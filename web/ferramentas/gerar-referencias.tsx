// Gera as referências da proposta pública a partir do código Next (fonte da verdade):
//  - web/propostas/render/icones.json   markup interno de cada ícone (usado pelo Django)
//  - web/propostas/render/datacenter.html  SVG da ilustração de data center
//  - web/propostas/tests/referencias/casos.json  entradas + cálculo + contexto + HTML
//    renderizado pelo PropostaView para cada um dos 18 modelos (e variações).
// Rodar na raiz do repositório enquanto o código Next existir:
//
//   npx tsx --tsconfig web/ferramentas/tsconfig.json web/ferramentas/gerar-referencias.tsx

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PropostaView } from "../../src/components/proposta/PropostaView";
import { ICONES, Icone } from "../../src/components/proposta/icones";
import { IlustracaoDatacenter } from "../../src/components/proposta/IlustracaoDatacenter";
import { montarContexto, preencher } from "../../src/lib/contexto";
import { valoresPadrao, type Campo, type Dados } from "../../src/lib/campos";
import type { ProdutoCatalogo } from "../../src/lib/precificacao";
import { temaDe } from "../../src/lib/tema";

const WEB = join(__dirname, "..");
const empresas = JSON.parse(readFileSync(join(WEB, "propostas/tests/referencias/empresas.json"), "utf8")) as {
  slug: string; nome: string; razao_social: string; site: string; rodape: string; tema: Record<string, string>;
}[];

// --- ícones e ilustração -------------------------------------------------------
const icones: Record<string, string> = {};
for (const nome of Object.keys(ICONES)) {
  const svg = renderToStaticMarkup(<Icone nome={nome} />);
  icones[nome] = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}
writeFileSync(join(WEB, "propostas/render/icones.json"), JSON.stringify(icones, null, 1) + "\n", "utf8");
writeFileSync(join(WEB, "propostas/render/datacenter.html"), renderToStaticMarkup(<IlustracaoDatacenter />) + "\n", "utf8");

// --- casos de proposta ----------------------------------------------------------
type Caso = Record<string, unknown>;
const casos: Caso[] = [];

function preencherDados(campos: Campo[], catalogo: ProdutoCatalogo[], variante: "a" | "b"): Dados {
  const dados = valoresPadrao(campos);
  for (const c of campos) {
    switch (c.tipo) {
      case "contato": dados[c.id] = { nome: variante === "a" ? "Grupo Exemplo Ltda" : "  " }; break;
      case "data": dados[c.id] = variante === "a" ? "2099-12-31" : "2020-01-15"; break;
      case "numero": dados[c.id] = (Number(c.padrao ?? 0) || 0) + (variante === "a" ? 3 : 1500); break;
      case "moeda": dados[c.id] = variante === "a" ? 1500.5 : 0; break;
      case "texto": if (variante === "b") dados[c.id] = "Texto com **negrito** & <tags>"; break;
      case "checkbox": dados[c.id] = variante === "a"; break;
      case "produto": {
        const doCampo = catalogo.filter((p) => p.categoria === c.categoria);
        if (variante === "b" && c.personalizado) {
          dados[c.id] = { codigo: "personalizado", personalizado: { nome: "Sob medida", preco: 2345.67, atributos: Object.fromEntries(c.personalizado.atributos.map((a, i) => [a.id, 10 + i])) } };
        } else if (variante === "a" && doCampo[1]) dados[c.id] = { codigo: doCampo[1].codigo };
        break;
      }
      case "desconto": dados[c.id] = variante === "a" ? { tipo: "pct", valor: 12.5 } : { tipo: "valor", valor: 99999 }; break;
      case "lista": dados[c.id] = variante === "a"
        ? [{ titulo: "Prazo", descricao: "Entrega em 30 dias" }, { titulo: "", descricao: "ignorado" }, { titulo: "Suporte", descricao: "24x7" }]
        : []; break;
      case "adicionais": dados[c.id] = variante === "a"
        ? [{ nome: "iFood", valor: 99.9, quantidade: 3 }, { nome: " ", valor: 10 }, { nome: "Cardápio", valor: 49.95 }]
        : [{ nome: "Extra", valor: 0.005, quantidade: 0 }]; break;
    }
  }
  return dados;
}

const arquivos = readdirSync(join(WEB, "seed/modelos")).filter((f) => f.endsWith(".json")).sort();
for (const arq of arquivos) {
  const item = JSON.parse(readFileSync(join(WEB, "seed/modelos", arq), "utf8"));
  const e = empresas.find((x) => x.slug === item.empresa)!;
  const tema = temaDe(e.tema);
  const catalogo: ProdutoCatalogo[] = (item.catalogo?.itens ?? []).map((p: Record<string, unknown>) => ({
    id: p.codigo, categoria: item.catalogo.categoria, codigo: p.codigo, nome: p.nome, descricao: p.descricao, preco: p.preco, atributos: p.atributos,
  }));
  const m = item.modelo;
  for (const variante of ["a", "b"] as const) {
    const dados = preencherDados(m.campos, catalogo, variante);
    const empresaCtx = { nome: e.razao_social ?? e.nome, site: e.site, rodape: e.rodape };
    const ctx = montarContexto({ campos: m.campos, precificacao: m.precificacao, dados, catalogo, empresa: empresaCtx });
    const decisao = variante === "b" && arq.startsWith("01") ? "ACEITA" : null;
    const html = renderToStaticMarkup(
      <PropostaView secoes={m.secoes} ctx={ctx} tema={tema} modo="publico" slug="exemplo" decisao={decisao} codigo="CAD-2026-1001" motivosRecusa={[]} />,
    );
    const textos = ["{{cliente}} · {{calc.totalMensal|brl}}", "{{ empresa.nome | maiusculas }}", "{{validade}} {{validadeISO|data}}",
      "{{calc.subtotal}} {{calc.desconto.pct}} {{calc.totalUnico|inteiro}}", "{{naoexiste}}|{{calc}}|{{observacoes}}", "{{x|filtroinexistente}}"];
    for (const c of m.campos) textos.push(`{{${c.id}}}`, `{{${c.id}.nome}}`, `{{${c.id}.preco|brl}}`);
    casos.push({
      nome: `${arq.replace(/\.json$/, "")}-${variante}`, empresa: e.slug, modelo: m, catalogo, dados, decisao,
      calc: ctx.calc, ctx: JSON.parse(JSON.stringify(ctx)), html,
      preenchidos: textos.map((t) => [t, preencher(t, ctx)]),
    });
  }
}
// --- caso sintético: tipos e ramos que os modelos do seed não usam --------------
{
  const e = empresas.find((x) => x.slug === "kolp")!;
  const tema = temaDe(e.tema);
  const campos = [
    { id: "cliente", tipo: "contato", rotulo: "Cliente" },
    { id: "validade", tipo: "data", rotulo: "Validade" },
    { id: "extra", tipo: "checkbox", rotulo: "Extra" },
  ] as Campo[];
  const secoes = [
    { id: "capa", tipo: "capa", capitulo: "", titulo: "Linha 1\nLinha 2 {{cliente}}", selos: [{ icone: "inexistente", texto: "Selo" }] },
    { id: "t1", tipo: "titulo", capitulo: "Título", eyebrow: "Olá {{cliente}}", titulo: "Centro **forte**", subtitulo: "Sub {{validade}}", alinhamento: "centro", fundo: "escuro", efeito: "zoom" },
    { id: "t2", tipo: "titulo", numero: "02", eyebrow: "Eyebrow cru {{cliente}}", titulo: "Esquerda", fundo: "tinta", efeito: "padrao" },
    { id: "tx", tipo: "texto", capitulo: "", titulo: "Texto", paragrafos: ["a", "", "b **c**", "d"], mostrarSe: "!extra" },
    { id: "tx2", tipo: "texto", titulo: "Escondido", paragrafos: ["x"], mostrarSe: "extra" },
    { id: "im1", tipo: "imagem", titulo: "Imagem", imagem: "/uploads/" + "a".repeat(32) + ".png", legenda: "Legenda {{cliente}}", largura: "total" },
    { id: "im2", tipo: "imagem", imagem: "javascript:alert(1)" },
    { id: "im3", tipo: "imagem", imagem: "https://exemplo.com/a b.png", titulo: "Sem legenda" },
    { id: "it1", tipo: "imagemTexto", numero: "03", eyebrow: "Eb", titulo: "Img e texto", paragrafos: ["p1", "", "p2"], imagem: "/empresas/kolp/logo.png", lado: "esquerda", botaoTexto: "Falar {{cliente}}", botaoUrl: "https://wa.me/5511999999999?text=oi mundo" },
    { id: "it2", tipo: "imagemTexto", titulo: "Direita", paragrafos: [], imagem: "", lado: "direita", botaoTexto: "Ruim", botaoUrl: "javascript:x" },
    { id: "it3", tipo: "imagemTexto", titulo: "Mail", paragrafos: ["z"], imagem: "data:image/png;base64,AAA", botaoTexto: "Mail", botaoUrl: "mailto:a@b.com" },
    { id: "v1", tipo: "video", titulo: "Vídeo", texto: "Veja **isto**", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { id: "v2", tipo: "video", url: "https://vimeo.com/123456789" },
    { id: "v3", tipo: "video", url: "https://evil.com/x" },
    { id: "fim", tipo: "fechamento", capitulo: "", titulo: "Fim", botao: "Aceitar" },
  ];
  const dados = { cliente: { nome: "Cliente <Sintético>" }, validade: "2099-12-31", extra: false };
  const empresaCtx = { nome: e.razao_social ?? e.nome, site: e.site, rodape: e.rodape };
  const modelo = { campos, secoes, precificacao: {} };
  for (const v of [
    { nome: "sintetico-publico", modo: "publico" as const, decisao: "RECUSADA" as const, aviso: undefined },
    { nome: "sintetico-previa", modo: "previa" as const, decisao: null, aviso: "Prévia do modelo com valores de exemplo" },
  ]) {
    const ctx = montarContexto({ campos, precificacao: {}, dados, catalogo: [], empresa: empresaCtx });
    const html = renderToStaticMarkup(
      <PropostaView secoes={secoes as never} ctx={ctx} tema={tema} modo={v.modo} slug="exemplo" decisao={v.decisao} codigo="KLP-2026-1001" motivosRecusa={[]} avisoPrevia={v.aviso} />,
    );
    casos.push({ nome: v.nome, empresa: "kolp", modelo, catalogo: [], dados, decisao: v.decisao, modo: v.modo, avisoPrevia: v.aviso ?? null,
      calc: ctx.calc, ctx: JSON.parse(JSON.stringify(ctx)), html, preenchidos: [] });
  }
}

writeFileSync(join(WEB, "propostas/tests/referencias/casos.json"), JSON.stringify(casos, null, 1) + "\n", "utf8");
console.log(`${Object.keys(icones).length} ícones, ${casos.length} casos de referência gerados.`);
