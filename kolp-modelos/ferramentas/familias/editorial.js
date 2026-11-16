module.exports = {
  nome: "Editorial",
  resumo: "Layout de revista para {nicho}: foto de página inteira na abertura, nome em destaque e lista com preços em três colunas.",
  tipo: "One-page", estilo: ["Editorial", "Tradicional"], efeitos: ["Parallax"], objetivo: ["Reserva", "WhatsApp"],
  fontes: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&family=Karla:wght@400;500;700&display=swap",
  script: `(function () {
  var foto = document.querySelector(".capa-foto");
  if (!foto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var marcado = false;
  addEventListener("scroll", function () {
    if (marcado) return; marcado = true;
    requestAnimationFrame(function () {
      if (scrollY < innerHeight * 1.2) foto.style.transform = "translate3d(0," + scrollY * 0.35 + "px,0) scale(1.08)";
      marcado = false;
    });
  }, { passive: true });
})();`,
  paletas: [
    { nome: "Terracota", tom: "Quente", primaria: "#9c3d22", destaque: "#56613a", fundo: "#f3e9d8", superficie: "#fbf5ea", texto: "#2a1d15" },
    { nome: "Vinho", tom: "Quente", primaria: "#6e1f2f", destaque: "#a07a3a", fundo: "#f4ebe1", superficie: "#fcf7f0", texto: "#261619" },
    { nome: "Oliva", tom: "Neutro", primaria: "#4a5a2c", destaque: "#b5552e", fundo: "#f1eddc", superficie: "#faf8ec", texto: "#20231a" },
    { nome: "Carvão", tom: "Neutro", primaria: "#26221f", destaque: "#c0803a", fundo: "#efe9df", superficie: "#f9f5ee", texto: "#1c1917" },
    { nome: "Azul-tinta", tom: "Frio", primaria: "#1e3550", destaque: "#b0623a", fundo: "#eef0ec", superficie: "#f8f9f5", texto: "#161c24" },
    { nome: "Ameixa", tom: "Quente", primaria: "#582a4a", destaque: "#b08b3e", fundo: "#f3ebea", superficie: "#fbf6f4", texto: "#241820" }
  ],
  html: (c) => { const { n, e } = c; return `
<header class="capa">
  <div class="capa-foto" aria-hidden="true" style="background-image:url(${c.f[0]})"></div>
  <nav class="capa-nav" aria-label="Principal"><a href="#casa">Sobre</a><a href="#lista">${e(n.catalogo.titulo)}</a><span class="capa-ano">${e(n.desde.toLowerCase())}</span><a href="#horarios">Horários</a><a href="#contato">Contato</a></nav>
  <div class="capa-titulo"><p>${e(c.sub)}</p><h1 style="--letras:${Math.max(c.nome.length, 6)}">${e(c.nome)}</h1><p class="capa-linha">${e(n.lema)}</p></div>
  <a class="capa-reserva" href="#contato">${e(n.cta)}</a>
</header>
<main>
  <section class="casa" id="casa"><div class="largura casa-grade">
    <div class="casa-texto">
      <h2>${c.destacar(c.titulo, "em")}</h2>
      <p class="capitular">${e(c.lide)}</p>
      <p>${e(n.servicos.intro)} ${e(n.equipe.intro)}</p>
      <p class="assinatura">${e(c.pessoas[0].nome)}<span>${e(c.pessoas[0].cargo)}</span></p>
    </div>
    <div class="casa-fotos"><img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy"><img src="${c.f[2]}" alt="" width="1400" height="930" loading="lazy"></div>
  </div></section>
  <section class="cardapio" id="lista"><div class="largura">
    <header class="cardapio-topo"><p class="ornamento">❦</p><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p></header>
    <div class="cardapio-grade">${n.catalogo.grupos.map((g) => `<section><h3>${e(g.nome)}</h3><ul>${g.itens.map((x) => `<li><div><b>${e(x[0])}</b><i></i><span>${e(x[2])}</span></div><p>${e(x[1])}</p></li>`).join("")}</ul></section>`).join("")}</div>
    <p class="cardapio-nota">${e(n.legal)}</p>
  </div></section>
  <section class="horarios" id="horarios"><div class="largura horarios-grade">
    <div><h2>Horários</h2><table>${n.contato.horario.map((h) => `<tr><th>${e(h[0])}</th><td>${e(h[1])}</td></tr>`).join("")}</table></div>
    <div><h2>Onde estamos</h2><p>${e(n.contato.endereco)}</p><p class="detalhe">${e(n.pontos[0])}.<br>${e(n.pontos[1])}.</p></div>
    <img src="${c.f[3]}" alt="" width="1400" height="930" loading="lazy">
  </div></section>
  <section class="reserva" id="contato"><div class="largura reserva-grade">
    <div><h2>${c.destacar(n.contato.titulo, "em")}</h2><p>${e(n.contato.texto)}</p><p class="reserva-fone"><a href="tel:">${e(n.contato.telefone)}</a></p></div>
    ${c.form({ mensagem: true })}
  </div></section>
</main>
<footer class="rodape"><p class="rodape-nome">${e(c.nome)}</p><p>${e(n.contato.endereco)} · ${e(n.registro)}</p></footer>`; }
};
