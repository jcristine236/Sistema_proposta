module.exports = {
  nome: "Minimal",
  resumo: "Layout enxuto para {nicho}: frase de abertura grande, seções numeradas, etapas em linha do tempo e resultados em número.",
  tipo: "Institucional", estilo: ["Minimalista", "Editorial"], efeitos: ["Animação ao rolar"], objetivo: ["Formulário de contato"], anima: true,
  fontes: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap",
  paletas: [
    { nome: "Preto e ferrugem", tom: "Neutro", primaria: "#1a1a1a", destaque: "#c2552d", fundo: "#fafaf7", superficie: "#ffffff", texto: "#1a1a1a" },
    { nome: "Azul-noite", tom: "Frio", primaria: "#14233f", destaque: "#3d7fd6", fundo: "#f8f9fb", superficie: "#ffffff", texto: "#131a26" },
    { nome: "Musgo", tom: "Neutro", primaria: "#24332a", destaque: "#8a9a3c", fundo: "#f8f8f3", superficie: "#ffffff", texto: "#1a211c" },
    { nome: "Ameixa", tom: "Quente", primaria: "#33202e", destaque: "#c0667a", fundo: "#faf7f8", superficie: "#ffffff", texto: "#221a20" },
    { nome: "Areia e cobre", tom: "Quente", primaria: "#2a241d", destaque: "#b8742c", fundo: "#f7f3ec", superficie: "#fffdf9", texto: "#211c16" },
    { nome: "Grafite e verde", tom: "Frio", primaria: "#1c2226", destaque: "#1f9a7a", fundo: "#f7f9f9", superficie: "#ffffff", texto: "#171c1f" }
  ],
  html: (c) => { const { n, e } = c; return `
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#">${e(c.nome)} <i>${e(c.sub)}</i></a>
  <nav aria-label="Principal"><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#processo">${e(n.processo.titulo)}</a><a href="#resultados">Resultados</a><a href="#equipe">${e(n.equipe.titulo)}</a><a class="nav-contato" href="#contato">Contato</a></nav>
</div></header>
<main>
  <section class="abertura">
    <div class="largura">
      <p class="indice">${e(n.local)} · ${e(n.desde)}</p>
      <h1 class="rev">${c.destacar(c.titulo, "em")}</h1>
      <div class="abertura-base rev"><p>${e(c.lide)}</p><a class="seta" href="#contato">${e(n.cta)}</a></div>
    </div>
    <figure class="abertura-foto rev"><img src="${c.f[0]}" alt="" width="1400" height="930"></figure>
  </section>
  <section class="frentes" id="servicos"><div class="largura bloco">
    <h2 class="rotulo">01 — ${e(n.servicos.titulo)}</h2>
    <div>${n.servicos.itens.slice(0, 4).map((x) => `<article class="rev"><h3>${e(x[0])}</h3><p>${e(x[1])}</p></article>`).join("")}</div>
  </div></section>
  <section class="metodo" id="processo"><div class="largura bloco">
    <h2 class="rotulo">02 — ${e(n.processo.titulo)}</h2>
    <div><p class="frase rev">${e(n.lema)}</p>
      <ol class="etapas">${n.processo.passos.map((x, i) => `<li class="rev"><span>Etapa ${i + 1}</span><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ol></div>
  </div></section>
  <figure class="faixa-foto rev"><img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy"></figure>
  <section class="casos" id="resultados"><div class="largura bloco">
    <h2 class="rotulo">03 — Resultados</h2>
    <div>${n.numeros.slice(0, 3).map((x, i) => `<article class="rev"><p class="resultado">${e(x[0])}<small>${e(x[1])}</small></p><div><h3>${e(n.casos[i][0])}</h3><p>${e(n.casos[i][1])}</p></div></article>`).join("")}</div>
  </div></section>
  <section class="socios" id="equipe"><div class="largura bloco">
    <h2 class="rotulo">04 — ${e(n.equipe.titulo)}</h2>
    <div class="socios-grade">${c.pessoas.slice(0, 2).map((p) => `<article class="rev"><img src="${p.foto}" alt="Retrato de ${e(p.nome)}" width="560" height="680" loading="lazy"><h3>${e(p.nome)}</h3><p>${e(p.bio)}</p></article>`).join("")}</div>
  </div></section>
  <section class="contato" id="contato"><div class="largura">
    <h2 class="rev">${e(n.contato.titulo)}</h2>
    <div class="contato-grade"><p class="rev">${e(n.contato.texto)}</p>${c.form({ classe: "rev", mensagem: true, botao: "Enviar →" })}</div>
  </div></section>
</main>
<footer class="rodape"><div class="largura"><p>${e(c.nome)} ${e(c.sub)} · ${e(n.registro)}</p><p>${e(n.contato.endereco)}</p><p>${e(n.contato.email)} · ${e(n.contato.telefone)}</p></div></footer>`; }
};
