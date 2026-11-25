/*
  Gera todos os modelos do catálogo: cada nicho (ferramentas/conteudo) em cada família de layout (ferramentas/familias).
  Uso, na raiz do projeto:  node ferramentas/gerar.js
  Saída: demo/<nicho>-NN/index.html + style.css  e  dados/modelos.js
*/
const fs = require("fs");
const path = require("path");
const raiz = path.resolve(__dirname, "..");

const FAMILIAS = ["classico", "leve", "editorial", "corporativo", "encarte", "minimal", "noturno", "acolhedor", "industrial", "lateral"]
  .map((id) => Object.assign({ id, css: fs.readFileSync(path.join(__dirname, "familias", id + ".css"), "utf8") }, require("./familias/" + id)));
const NICHOS = ["advocacia", "saude", "restaurante", "contabilidade", "comercio", "consultoria", "servicos", "imobiliaria", "estetica", "construcao", "educacao", "tecnologia", "eventos"]
  .map((id) => Object.assign({ id }, require("./conteudo/" + id)));
/* Endereço público do catálogo: usado nas prévias de link (WhatsApp, redes sociais), que exigem URL completa */
const ENDERECO = "https://kolp.com.br/modelos/";
const QTD_FOTOS = (id) => fs.readdirSync(path.join(raiz, "fotos", id)).length;

const e = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function sobre(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.42 ? "#16161a" : "#ffffff";
}
/* Envolve um trecho do meio do título em uma tag, para os layouts que destacam parte da frase */
function destacar(titulo, tag) {
  const p = titulo.split(" ");
  if (p.length < 5) return e(titulo);
  const i = Math.floor(p.length / 2) - 1, f = Math.min(i + 3, p.length);
  return e(p.slice(0, i).join(" ")) + ` <${tag}>` + e(p.slice(i, f).join(" ")) + `</${tag}> ` + e(p.slice(f).join(" "));
}
const SCRIPT_FORM = `document.querySelectorAll("form[data-whatsapp]").forEach(function (f) {
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var linhas = [f.dataset.assunto || "Contato pelo site"];
    new FormData(f).forEach(function (v, k) { if (v) linhas.push(k + ": " + v); });
    window.open("https://wa.me/" + f.dataset.whatsapp + "?text=" + encodeURIComponent(linhas.join("\\n")), "_blank");
  });
});`;
const SCRIPT_ANIMA = `if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("anima");
  var obs = new IntersectionObserver(function (itens) {
    itens.forEach(function (i) { if (i.isIntersecting) { i.target.classList.add("visivel"); obs.unobserve(i.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".rev").forEach(function (el) { obs.observe(el); });
}`;

fs.rmSync(path.join(raiz, "demo"), { recursive: true, force: true });
const modelos = [];
let seq = 0;

NICHOS.forEach((n, ni) => {
  const nf = QTD_FOTOS(n.id);
  FAMILIAS.forEach((fam, k) => {
    seq++;
    const codigo = "KOLP-" + String(seq).padStart(3, "0");
    const pasta = n.id + "-" + String(k + 1).padStart(2, "0");
    const neg = n.negocios[k];
    const titulo = n.titulos[k];
    const lide = n.lides[k % n.lides.length];
    const paletas = [0, 1, 2, 3].map((j) => fam.paletas[(ni + j) % fam.paletas.length]);
    const sexo = { m: 0, f: 0 };
    const pessoas = n.equipe.pessoas.map((p, j) => {
      const s = p[3] || "m";
      const foto = `../../fotos/retratos/${s}${((ni + k * 2 + sexo[s]++) % 6) + 1}.jpg`;
      return { nome: p[0], cargo: p[1], bio: p[2], foto };
    });
    const zap = (texto) => "https://wa.me/5511999999999?text=" + encodeURIComponent(texto || "Olá! Vim pelo site.");
    const c = {
      n, e, destacar, codigo, pessoas, zap,
      nome: neg[0], sub: neg[1], titulo, lide,
      depoFoto: `../../fotos/retratos/${n.depoimento[3] || "f"}${((ni + k) % 6) + 1}.jpg`,
      /* Com 10 ou mais fotos no nicho, cada modelo começa num ponto diferente da lista e a foto de abertura não se repete */
      f: [0, 1, 2, 3, 4].map((j) => `../../fotos/${n.id}/${(((nf >= 10 ? Math.floor(k * nf / 10) : k) + j) % nf) + 1}.jpg`),
      itens: n.catalogo.grupos.reduce((a, g) => a.concat(g.itens.map((i) => ({ grupo: g.nome, nome: i[0], desc: i[1], valor: i[2] }))), []),
      horarioTexto: n.contato.horario.map((h) => h[0] + ", " + h[1]).join(" · "),
      form(o) {
        o = o || {};
        return `<form${o.classe ? ` class="${o.classe}"` : ""} data-whatsapp="5511999999999" data-assunto="${e((o.assunto || "Contato") + " — " + neg[0])}">
        ${o.titulo ? `<h2>${e(o.titulo)}</h2>` : ""}${o.texto ? `<p>${e(o.texto)}</p>` : ""}
        <label>Nome<input name="Nome" required autocomplete="name"></label>
        <label>Telefone ou WhatsApp<input name="Telefone" type="tel" required autocomplete="tel"></label>
        <label>${e(n.contato.rotulo || "Assunto")}<select name="${e(n.contato.rotulo || "Assunto")}">${n.contato.opcoes.map((x) => `<option>${e(x)}</option>`).join("")}</select></label>
        ${o.mensagem ? `<label>Mensagem<textarea name="Mensagem" rows="3"></textarea></label>` : ""}
        <button class="botao" type="submit">${e(o.botao || n.cta)}</button>
      </form>`;
      }
    };
    const corpo = fam.html(c);
    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${e(neg[0])}${neg[1] ? " " + e(neg[1]) : ""} — ${e(n.nome)}</title>
<meta name="description" content="${e(lide)}">
<!-- Demonstração KOLP: prévia do link no WhatsApp (remover na entrega) -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="KOLP — Modelos de sites">
<meta property="og:title" content="${codigo} · ${e(neg[0])} — modelo de site para ${e(n.nome)}">
<meta property="og:description" content="Layout ${e(fam.nome)}. Abra a demonstração, teste as suas cores e peça este modelo à KOLP.">
<meta property="og:url" content="${ENDERECO}demo/${pasta}/">
<meta property="og:image" content="${ENDERECO}compartilhar/${pasta}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fam.fontes}" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
${corpo.trim()}

<script>
${corpo.includes("data-whatsapp") ? SCRIPT_FORM : ""}
${fam.anima ? SCRIPT_ANIMA : ""}
${fam.script || ""}
</script>
<!-- Demonstração KOLP: remover as três linhas abaixo na entrega -->
<script src="../../dados/config.js"></script>
<script src="../../dados/modelos.js"></script>
<script src="../../assets/demo.js"></script>
</body>
</html>
`.replace(/<script>\s*<\/script>\n/, "");

    const p0 = paletas[0];
    const vars = ["primaria", "destaque", "fundo", "superficie", "texto"].map((x) => `  --cor-${x}: ${p0[x]};`).join("\n") +
      `\n  --cor-sobre-primaria: ${sobre(p0.primaria)};\n  --cor-sobre-destaque: ${sobre(p0.destaque)};`;
    const css = `/* ${codigo} · ${n.nome} · layout ${fam.nome} */\n` + fam.css.replace("/*PALETA*/", vars);

    const dir = path.join(raiz, "demo", pasta);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    fs.writeFileSync(path.join(dir, "style.css"), css);

    modelos.push({
      codigo, pasta, nome: neg[0] + (neg[1] ? " " + neg[1] : ""), layout: fam.nome,
      resumo: fam.resumo.replace("{nicho}", n.rotulo),
      nicho: n.nome, tipo: fam.tipo, estilo: fam.estilo,
      tom: [fam.escuro ? "Escuro" : "Claro", p0.tom],
      efeitos: fam.efeitos, objetivo: fam.objetivo,
      paletas: paletas.map((p) => ({ nome: p.nome, primaria: p.primaria, destaque: p.destaque, fundo: p.fundo, superficie: p.superficie, texto: p.texto }))
    });
  });
});

const filtros = {
  nicho: NICHOS.map((n) => n.nome),
  layout: FAMILIAS.map((f) => f.nome),
  tipo: ["Landing page", "Institucional", "One-page", "Página de captura"],
  estilo: ["Tradicional", "Moderno", "Minimalista", "Editorial", "Ousado", "Corporativo", "Acolhedor", "Industrial", "Sofisticado"],
  tom: ["Claro", "Escuro", "Quente", "Frio", "Neutro"],
  efeitos: ["Sem efeitos", "Animação ao rolar", "Parallax", "Letreiro animado"],
  objetivo: ["WhatsApp", "Formulário de contato", "Agendamento", "Orçamento", "Reserva"]
};
fs.writeFileSync(path.join(raiz, "dados", "modelos.js"),
  "/* Arquivo gerado por ferramentas/gerar.js — não edite à mão. */\n" +
  "window.KOLP_FILTROS = " + JSON.stringify(filtros, null, 1) + ";\n" +
  "window.KOLP_MODELOS = [\n" + modelos.map((m) => JSON.stringify(m)).join(",\n") + "\n];\n");
console.log(modelos.length + " modelos gerados em " + NICHOS.length + " nichos.");
