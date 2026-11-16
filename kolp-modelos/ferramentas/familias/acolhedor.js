module.exports = {
  nome: "Acolhedor",
  resumo: "Layout caloroso para {nicho}: abertura centralizada com mosaico de fotos, formas arredondadas e blocos alternados.",
  tipo: "Landing page", estilo: ["Acolhedor", "Moderno"], efeitos: ["Animação ao rolar"], objetivo: ["WhatsApp", "Formulário de contato"], anima: true,
  fontes: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Mulish:wght@400;600;700&display=swap",
  paletas: [
    { nome: "Argila e sálvia", tom: "Quente", primaria: "#b65c3a", destaque: "#7d8f69", fundo: "#fbf4ea", superficie: "#fffdf9", texto: "#33241c" },
    { nome: "Sálvia e mel", tom: "Neutro", primaria: "#58735a", destaque: "#d9a24a", fundo: "#f5f5ea", superficie: "#fffffa", texto: "#232c22" },
    { nome: "Rosa-chá", tom: "Quente", primaria: "#b8576a", destaque: "#c99a5b", fundo: "#fcf2ef", superficie: "#fffbfa", texto: "#35202a" },
    { nome: "Azul-névoa", tom: "Frio", primaria: "#3f6c8c", destaque: "#e0976a", fundo: "#f1f5f6", superficie: "#fcfeff", texto: "#1c2a33" },
    { nome: "Mostarda", tom: "Quente", primaria: "#a8741a", destaque: "#4f7a6c", fundo: "#fbf6e6", superficie: "#fffdf5", texto: "#2e2513" },
    { nome: "Lilás e pêssego", tom: "Frio", primaria: "#7560a8", destaque: "#e8a07c", fundo: "#f6f3fa", superficie: "#fdfcff", texto: "#262034" }
  ],
  html: (c) => { const { n, e } = c; const a = n.servicos.itens; return `
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#">${e(c.nome)}<span>${e(c.sub)}</span></a>
  <nav aria-label="Principal"><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#equipe">${e(n.equipe.titulo)}</a><a href="#contato">Contato</a></nav>
  <a class="botao botao-p" href="${c.zap()}">WhatsApp</a>
</div></header>
<main>
  <section class="abertura"><div class="largura">
    <p class="rotulo">${e(n.local)} · ${e(n.desde)}</p>
    <h1>${c.destacar(c.titulo, "em")}</h1>
    <p class="lide">${e(c.lide)}</p>
    <div class="acoes"><a class="botao" href="#contato">${e(n.cta)}</a><a class="elo" href="#servicos">${e(n.cta2)}</a></div>
    <div class="mosaico">
      <img class="m1" src="${c.f[1]}" alt="" width="1400" height="930">
      <img class="m2" src="${c.f[0]}" alt="" width="1400" height="930">
      <img class="m3" src="${c.f[2]}" alt="" width="1400" height="930">
      <p class="selo"><b>${e(n.numeros[0][0])}</b>${e(n.numeros[0][1])}</p>
    </div>
  </div></section>
  <section class="pontos"><ul class="largura">${n.pontos.map((x) => `<li class="rev">${e(x)}</li>`).join("")}</ul></section>
  <section class="servicos" id="servicos"><div class="largura">
    <header class="topo rev"><h2>${e(n.servicos.titulo)}</h2><p>${e(n.servicos.intro)}</p></header>
    <div class="par rev"><img src="${c.f[3]}" alt="" width="1400" height="930" loading="lazy"><ul>${a.slice(0, 3).map((x) => `<li><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ul></div>
    <div class="par par-inv rev"><img src="${c.f[4]}" alt="" width="1400" height="930" loading="lazy"><ul>${a.slice(3, 6).map((x) => `<li><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ul></div>
  </div></section>
  <section class="precos" id="precos"><div class="largura">
    <header class="topo rev"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p></header>
    <div class="precos-grade">${n.catalogo.grupos.map((g) => `<article class="rev"><h3>${e(g.nome)}</h3><ul>${g.itens.map((x) => `<li><span>${e(x[0])}<small>${e(x[1])}</small></span><b>${e(x[2])}</b></li>`).join("")}</ul></article>`).join("")}</div>
  </div></section>
  <section class="equipe" id="equipe"><div class="largura">
    <header class="topo rev"><h2>${e(n.equipe.titulo)}</h2><p>${e(n.equipe.intro)}</p></header>
    <div class="equipe-grade">${c.pessoas.map((p) => `<article class="rev"><img src="${p.foto}" alt="${e(p.nome)}" width="560" height="680" loading="lazy"><h3>${e(p.nome)}</h3><p class="cargo">${e(p.cargo)}</p><p>${e(p.bio)}</p></article>`).join("")}</div>
    <blockquote class="balao rev"><p>${e(n.depoimento[0])}</p><footer><b>${e(n.depoimento[1])}</b> · ${e(n.depoimento[2])}</footer></blockquote>
  </div></section>
  <section class="contato" id="contato"><div class="largura contato-caixa rev">
    <div><h2>${e(n.contato.titulo)}</h2><p>${e(n.contato.texto)}</p>
      <ul class="dados"><li>${e(n.contato.endereco)}</li><li>${e(c.horarioTexto)}</li><li>${e(n.contato.telefone)} · ${e(n.contato.email)}</li></ul></div>
    ${c.form({ mensagem: true })}
  </div></section>
</main>
<footer class="rodape"><div class="largura"><p><b>${e(c.nome)}</b> ${e(c.sub)}</p><p>${e(n.registro)} · ${e(n.legal)}</p></div></footer>`; }
};
