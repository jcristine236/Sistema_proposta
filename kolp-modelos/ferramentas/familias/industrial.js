module.exports = {
  nome: "Industrial",
  resumo: "Layout robusto para {nicho}: títulos condensados em caixa alta, bloco de cor em diagonal, grade numerada e tabela de preços.",
  tipo: "Institucional", estilo: ["Industrial", "Ousado"], efeitos: ["Sem efeitos"], objetivo: ["Orçamento", "WhatsApp"],
  fontes: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap",
  paletas: [
    { nome: "Amarelo-obra", tom: "Quente", primaria: "#1d1f22", destaque: "#f5b81c", fundo: "#f2f1ed", superficie: "#ffffff", texto: "#1d1f22" },
    { nome: "Laranja e aço", tom: "Quente", primaria: "#23303b", destaque: "#f26a1b", fundo: "#f1f3f4", superficie: "#ffffff", texto: "#1a2228" },
    { nome: "Azul e amarelo", tom: "Frio", primaria: "#0e3a6b", destaque: "#ffcf24", fundo: "#f0f3f7", superficie: "#ffffff", texto: "#12202f" },
    { nome: "Vermelho e grafite", tom: "Neutro", primaria: "#262626", destaque: "#e0301e", fundo: "#f3f2f0", superficie: "#ffffff", texto: "#1c1c1c" },
    { nome: "Verde-máquina", tom: "Neutro", primaria: "#1f3b2c", destaque: "#b6d43a", fundo: "#f1f3ee", superficie: "#ffffff", texto: "#17231b" },
    { nome: "Petróleo e cobre", tom: "Frio", primaria: "#103840", destaque: "#e08a3c", fundo: "#eff3f3", superficie: "#ffffff", texto: "#10262a" }
  ],
  html: (c) => { const { n, e } = c; return `
<div class="aviso"><div class="largura"><span>${e(n.registro)}</span><span>${e(c.horarioTexto)}</span><a href="tel:">${e(n.contato.telefone)}</a></div></div>
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#"><b>${e(c.nome)}</b><span>${e(c.sub)}</span></a>
  <nav aria-label="Principal"><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#processo">${e(n.processo.titulo)}</a><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#contato">Contato</a></nav>
  <a class="botao" href="#contato">${e(n.cta)}</a>
</div></header>
<main>
  <section class="abertura">
    <img src="${c.f[0]}" alt="" width="1400" height="930">
    <div class="abertura-bloco"><div>
      <p class="rotulo">${e(n.local)}</p>
      <h1>${e(c.titulo)}</h1>
      <p class="lide">${e(c.lide)}</p>
      <div class="acoes"><a class="botao botao-claro" href="#contato">${e(n.cta)}</a><a class="botao botao-vazado" href="#servicos">${e(n.cta2)}</a></div>
    </div></div>
  </section>
  <section class="numeros"><dl class="largura">${n.numeros.map((x) => `<div><dd>${e(x[0])}</dd><dt>${e(x[1])}</dt></div>`).join("")}</dl></section>
  <section class="servicos" id="servicos"><div class="largura">
    <header class="topo"><h2>${e(n.servicos.titulo)}</h2><p>${e(n.servicos.intro)}</p></header>
    <ol class="grade">${n.servicos.itens.map((x) => `<li><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ol>
  </div></section>
  <section class="processo" id="processo"><div class="largura">
    <h2>${e(n.processo.titulo)}</h2>
    <ol class="etapas">${n.processo.passos.map((x, i) => `<li><span>${i + 1}</span><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ol>
  </div></section>
  <section class="precos" id="precos"><div class="largura">
    <header class="topo"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p></header>
    <div class="tabela-rolagem"><table>${n.catalogo.grupos.map((g) => `<tbody><tr class="grupo"><th colspan="3">${e(g.nome)}</th></tr>${g.itens.map((x) => `<tr><th>${e(x[0])}</th><td>${e(x[1])}</td><td>${e(x[2])}</td></tr>`).join("")}</tbody>`).join("")}</table></div>
  </div></section>
  <section class="prova"><img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy">
    <blockquote><p>“${e(n.depoimento[0])}”</p><footer><b>${e(n.depoimento[1])}</b> ${e(n.depoimento[2])}</footer></blockquote>
  </section>
  <section class="contato" id="contato"><div class="largura contato-grade">
    <div class="contato-info"><h2>${e(n.contato.titulo)}</h2><p>${e(n.contato.texto)}</p>
      <dl><dt>Endereço</dt><dd>${e(n.contato.endereco)}</dd><dt>Telefone</dt><dd>${e(n.contato.telefone)}</dd><dt>E-mail</dt><dd>${e(n.contato.email)}</dd></dl></div>
    ${c.form({ mensagem: true, assunto: "Pedido de orçamento" })}
  </div></section>
</main>
<footer class="rodape"><div class="largura"><a class="marca" href="#"><b>${e(c.nome)}</b><span>${e(c.sub)}</span></a><p>${e(n.registro)} · ${e(n.legal)}</p></div></footer>`; }
};
