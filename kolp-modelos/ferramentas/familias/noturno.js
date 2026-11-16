module.exports = {
  nome: "Noturno",
  resumo: "Layout escuro e sofisticado para {nicho}: foto em arco, cartões numerados e lista de preços que abre por categoria.",
  tipo: "Landing page", estilo: ["Sofisticado", "Moderno"], efeitos: ["Animação ao rolar"], objetivo: ["Formulário de contato", "WhatsApp"], anima: true, escuro: true,
  fontes: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;700;900&family=Red+Hat+Text:wght@400;500&display=swap",
  paletas: [
    { nome: "Carvão e ouro", tom: "Quente", primaria: "#d9a441", destaque: "#f1e3c2", fundo: "#111214", superficie: "#1b1d21", texto: "#f1efe9" },
    { nome: "Noite e menta", tom: "Frio", primaria: "#5fd6a8", destaque: "#c9f2e2", fundo: "#0d1518", superficie: "#152126", texto: "#eaf2f0" },
    { nome: "Vinho e rosé", tom: "Quente", primaria: "#e58a8a", destaque: "#f6d7cf", fundo: "#1a1013", superficie: "#27181d", texto: "#f5ecea" },
    { nome: "Azul e gelo", tom: "Frio", primaria: "#6aa9ff", destaque: "#d3e4ff", fundo: "#0c111b", superficie: "#151c2a", texto: "#edf1f8" },
    { nome: "Floresta e cobre", tom: "Neutro", primaria: "#d98a52", destaque: "#f0d9c4", fundo: "#101613", superficie: "#19221d", texto: "#eef1ec" },
    { nome: "Grafite e limão", tom: "Neutro", primaria: "#cfe35a", destaque: "#eef5c4", fundo: "#141414", superficie: "#1f1f1f", texto: "#f2f2ee" }
  ],
  html: (c) => { const { n, e } = c; return `
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#">${e(c.nome)}<span>${e(c.sub)}</span></a>
  <nav aria-label="Principal"><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#duvidas">Dúvidas</a></nav>
  <a class="botao botao-linha" href="#contato">${e(n.cta)}</a>
</div></header>
<main>
  <section class="abertura"><div class="largura abertura-grade">
    <div>
      <p class="rotulo">${e(n.local)}</p>
      <h1>${c.destacar(c.titulo, "em")}</h1>
      <p class="lide">${e(c.lide)}</p>
      <div class="acoes"><a class="botao" href="#contato">${e(n.cta)}</a><a class="elo" href="#servicos">${e(n.cta2)}</a></div>
    </div>
    <figure class="arco"><img src="${c.f[0]}" alt="" width="1400" height="930"><figcaption>${e(n.desde)}</figcaption></figure>
  </div>
  <div class="largura"><dl class="indices">${n.numeros.map((x) => `<div><dd>${e(x[0])}</dd><dt>${e(x[1])}</dt></div>`).join("")}</dl></div>
  </section>
  <section class="servicos" id="servicos"><div class="largura">
    <header class="topo rev"><h2>${e(n.servicos.titulo)}</h2><p>${e(n.servicos.intro)}</p></header>
    <ol class="cartoes">${n.servicos.itens.map((x) => `<li class="rev"><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ol>
  </div></section>
  <section class="faixa rev"><img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy"><p>“${e(n.lema)}”</p></section>
  <section class="precos" id="precos"><div class="largura precos-grade">
    <div class="precos-lado rev"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p><a class="botao" href="#contato">${e(n.cta)}</a></div>
    <div class="rev">${n.catalogo.grupos.map((g, i) => `<details${i ? "" : " open"}><summary>${e(g.nome)}</summary><ul>${g.itens.map((x) => `<li><div><b>${e(x[0])}</b><span>${e(x[1])}</span></div><strong>${e(x[2])}</strong></li>`).join("")}</ul></details>`).join("")}</div>
  </div></section>
  <section class="depo"><div class="largura depo-grade rev">
    <img src="${c.depoFoto}" alt="" width="560" height="680" loading="lazy">
    <blockquote><p>${e(n.depoimento[0])}</p><footer><b>${e(n.depoimento[1])}</b>${e(n.depoimento[2])}</footer></blockquote>
  </div></section>
  <section class="fim" id="duvidas"><div class="largura fim-grade">
    <div class="rev"><h2>Perguntas frequentes</h2><dl class="faq">${n.faq.map((x) => `<dt>${e(x[0])}</dt><dd>${e(x[1])}</dd>`).join("")}</dl></div>
    <div class="rev" id="contato">${c.form({ classe: "cartao-form", titulo: n.contato.titulo, texto: n.contato.texto, mensagem: true })}</div>
  </div></section>
</main>
<footer class="rodape"><div class="largura"><a class="marca" href="#">${e(c.nome)}<span>${e(c.sub)}</span></a><p>${e(n.contato.endereco)}<br>${e(c.horarioTexto)}</p><p>${e(n.contato.telefone)}<br>${e(n.contato.email)}<br>${e(n.registro)}</p></div></footer>`; }
};
