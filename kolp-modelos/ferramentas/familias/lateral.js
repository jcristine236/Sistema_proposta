module.exports = {
  nome: "Lateral",
  resumo: "Layout com menu fixo na lateral para {nicho}: leitura em coluna, foto com legenda sobreposta e listas com fios finos.",
  tipo: "Institucional", estilo: ["Tradicional", "Editorial"], efeitos: ["Sem efeitos"], objetivo: ["Formulário de contato"],
  fontes: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
  paletas: [
    { nome: "Azul-tinta", tom: "Frio", primaria: "#1c2b45", destaque: "#b4873f", fundo: "#f6f4ef", superficie: "#ffffff", texto: "#1b1e24" },
    { nome: "Verde-inglês", tom: "Neutro", primaria: "#1d3a2f", destaque: "#b98a42", fundo: "#f4f4ee", superficie: "#ffffff", texto: "#1a201c" },
    { nome: "Tijolo", tom: "Quente", primaria: "#7a2e1f", destaque: "#c59a52", fundo: "#f8f2ea", superficie: "#fffdf9", texto: "#251a16" },
    { nome: "Chumbo", tom: "Neutro", primaria: "#2d3033", destaque: "#a67c3d", fundo: "#f4f3f1", superficie: "#ffffff", texto: "#1c1d1f" },
    { nome: "Berinjela", tom: "Quente", primaria: "#3b2440", destaque: "#b58d4a", fundo: "#f6f2f3", superficie: "#fffdfd", texto: "#221a24" },
    { nome: "Petróleo", tom: "Frio", primaria: "#14434a", destaque: "#c08b45", fundo: "#f1f5f4", superficie: "#ffffff", texto: "#142123" }
  ],
  html: (c) => { const { n, e } = c; return `
<aside class="lateral">
  <a class="marca" href="#"><span>${e(c.sub)}</span>${e(c.nome)}</a>
  <nav aria-label="Principal"><a href="#sobre">Apresentação</a><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#equipe">${e(n.equipe.titulo)}</a><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#duvidas">Perguntas frequentes</a><a href="#contato">Contato</a></nav>
  <div class="lateral-pe"><p>${e(n.contato.telefone)}</p><p>${e(c.horarioTexto)}</p><a class="botao" href="#contato">${e(n.cta)}</a></div>
</aside>
<div class="conteudo">
<main>
  <section class="abertura">
    <img src="${c.f[0]}" alt="" width="1400" height="930">
    <div class="legenda"><p class="rotulo">${e(n.desde)} · ${e(n.local)}</p><h1>${e(c.titulo)}</h1></div>
  </section>
  <section class="sobre" id="sobre">
    <div><p class="capitular">${e(c.lide)}</p><ul>${n.pontos.map((x) => `<li>${e(x)}</li>`).join("")}</ul></div>
    <dl>${n.numeros.map((x) => `<div><dd>${e(x[0])}</dd><dt>${e(x[1])}</dt></div>`).join("")}</dl>
  </section>
  <section id="servicos">
    <header class="topo"><h2>${e(n.servicos.titulo)}</h2><p>${e(n.servicos.intro)}</p></header>
    <ul class="servicos">${n.servicos.itens.map((x) => `<li><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ul>
  </section>
  <figure class="citacao"><img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy"><blockquote>“${e(n.lema)}”</blockquote></figure>
  <section id="equipe">
    <header class="topo"><h2>${e(n.equipe.titulo)}</h2><p>${e(n.equipe.intro)}</p></header>
    <div class="equipe">${c.pessoas.map((p) => `<article><img src="${p.foto}" alt="Retrato de ${e(p.nome)}" width="560" height="680" loading="lazy"><div><h3>${e(p.nome)}</h3><p class="cargo">${e(p.cargo)}</p><p>${e(p.bio)}</p></div></article>`).join("")}</div>
  </section>
  <section id="precos">
    <header class="topo"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p></header>
    <div class="precos">${n.catalogo.grupos.map((g) => `<div><h3>${e(g.nome)}</h3><ul>${g.itens.map((x) => `<li><span>${e(x[0])}</span><b>${e(x[2])}</b></li>`).join("")}</ul></div>`).join("")}</div>
  </section>
  <section id="duvidas">
    <header class="topo"><h2>Perguntas frequentes</h2></header>
    <div class="faq">${n.faq.map((x) => `<details><summary>${e(x[0])}</summary><p>${e(x[1])}</p></details>`).join("")}</div>
  </section>
  <section class="contato" id="contato">
    <div><h2>${e(n.contato.titulo)}</h2><p>${e(n.contato.texto)}</p><address>${e(n.contato.endereco)}<br>${e(n.contato.telefone)}<br>${e(n.contato.email)}</address></div>
    ${c.form({ mensagem: true })}
  </section>
</main>
<footer class="rodape"><p>© 2026 ${e(c.nome)} ${e(c.sub)} · ${e(n.registro)}</p><p>${e(n.legal)}</p></footer>
</div>`; }
};
