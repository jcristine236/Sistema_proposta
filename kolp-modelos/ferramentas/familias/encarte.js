module.exports = {
  nome: "Encarte",
  resumo: "Layout chamativo para {nicho}: letreiro animado, títulos enormes e preços em etiquetas, com pedido pelo WhatsApp.",
  tipo: "One-page", estilo: ["Ousado"], efeitos: ["Letreiro animado"], objetivo: ["WhatsApp"],
  fontes: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&display=swap",
  paletas: [
    { nome: "Tomate e amarelo", tom: "Quente", primaria: "#e03c22", destaque: "#ffc93c", fundo: "#fff8ea", superficie: "#ffffff", texto: "#1b1a17" },
    { nome: "Verde e amarelo", tom: "Quente", primaria: "#1e7a3c", destaque: "#ffd23f", fundo: "#f8f9ec", superficie: "#ffffff", texto: "#162018" },
    { nome: "Azul e laranja", tom: "Frio", primaria: "#1746a2", destaque: "#ff8a1f", fundo: "#f5f7fc", superficie: "#ffffff", texto: "#14192a" },
    { nome: "Preto e limão", tom: "Neutro", primaria: "#181818", destaque: "#d8f04a", fundo: "#f6f5ef", superficie: "#ffffff", texto: "#181818" },
    { nome: "Rosa e creme", tom: "Quente", primaria: "#d6336c", destaque: "#ffd9a0", fundo: "#fff6f3", superficie: "#ffffff", texto: "#22141a" },
    { nome: "Roxo e menta", tom: "Frio", primaria: "#5b2fc9", destaque: "#7ee8c2", fundo: "#f6f4fc", superficie: "#ffffff", texto: "#1a1530" }
  ],
  html: (c) => { const { n, e } = c;
    const avisos = n.pontos.concat([n.lema]);
    const menor = n.numeros.slice().sort((a, b) => a[0].length - b[0].length)[0]; return `
<div class="letreiro" aria-label="Avisos"><div class="letreiro-trilho">${avisos.map((x) => `<span>${e(x)}</span>`).join("")}${avisos.map((x) => `<span aria-hidden="true">${e(x)}</span>`).join("")}</div></div>
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#">${e(c.sub)}<b>${e(c.nome)}</b></a>
  <nav aria-label="Principal"><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#processo">Como funciona</a><a href="#local">Endereço</a></nav>
  <a class="botao" href="${c.zap()}">Chamar no WhatsApp</a>
</div></header>
<main>
  <section class="abertura"><div class="largura abertura-grade">
    <div>
      <h1>${c.destacar(c.titulo, "span")}</h1>
      <p class="lide">${e(c.lide)}</p>
      <div class="acoes"><a class="botao botao-grande" href="${c.zap()}">${e(n.cta)}</a><a class="elo" href="#precos">${e(n.cta2)} ↓</a></div>
    </div>
    <div class="abertura-foto"><img src="${c.f[0]}" alt="" width="1400" height="930"><p class="selo-redondo"><b>${e(menor[0])}</b>${e(menor[1])}</p></div>
  </div></section>
  <section class="ofertas" id="precos"><div class="largura">
    <header class="topo-ofertas"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p></header>
    <ul class="encarte">${c.itens.slice(0, 10).map((x, i) => `<li${i === 0 || i === 6 ? ' class="grande"' : ""}><p class="secao">${e(x.grupo)}</p><h3>${e(x.nome)}</h3><p class="un">${e(x.desc)}</p><p class="por">${e(x.valor)}</p></li>`).join("")}</ul>
  </div></section>
  <section class="secoes" id="servicos"><div class="largura">
    <h2>${e(n.servicos.titulo)}</h2>
    <ul class="secoes-lista">${n.servicos.itens.map((x) => `<li><b>${e(x[0])}</b><span>${e(x[1])}</span></li>`).join("")}</ul>
  </div></section>
  <section class="pedir" id="processo"><div class="largura pedir-grade">
    <img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy">
    <div><h2>${e(n.processo.titulo)}</h2>
      <ol>${n.processo.passos.slice(0, 3).map((x) => `<li><b>${e(x[0])}</b>${e(x[1])}</li>`).join("")}</ol>
      <a class="botao botao-grande" href="${c.zap()}">${e(n.cta)}</a></div>
  </div></section>
  <section class="loja" id="local">
    <img class="loja-fundo" src="${c.f[2]}" alt="" width="1400" height="930" loading="lazy">
    <div class="largura loja-grade"><div class="cartao">
      <h2>${e(n.contato.titulo)}</h2>
      <p class="endereco">${e(n.contato.endereco)}</p>
      <table>${n.contato.horario.map((h) => `<tr><th>${e(h[0])}</th><td>${e(h[1])}</td></tr>`).join("")}</table>
      <p class="extras">${e(n.contato.telefone)} · ${e(n.contato.email)}</p>
    </div></div>
  </section>
</main>
<footer class="rodape"><div class="largura"><a class="marca" href="#">${e(c.sub)}<b>${e(c.nome)}</b></a><p>${e(n.registro)}<br>${e(n.legal)}</p></div></footer>`; }
};
