module.exports = {
  nome: "Clássico",
  resumo: "Layout tradicional para {nicho}: tipografia serifada, lista numerada em algarismos romanos e apresentação da equipe.",
  tipo: "Institucional", estilo: ["Tradicional"], efeitos: ["Sem efeitos"], objetivo: ["Formulário de contato", "WhatsApp"],
  fontes: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap",
  paletas: [
    { nome: "Verde-garrafa", tom: "Quente", primaria: "#1f3a34", destaque: "#a8823c", fundo: "#f6f2ea", superficie: "#fffdf8", texto: "#1d1d1b" },
    { nome: "Azul-marinho", tom: "Frio", primaria: "#1b2a4a", destaque: "#b08a4a", fundo: "#f4f2ee", superficie: "#ffffff", texto: "#191b20" },
    { nome: "Bordô", tom: "Quente", primaria: "#5a1f28", destaque: "#9a7b4f", fundo: "#f7f1ec", superficie: "#fffcf9", texto: "#211a1a" },
    { nome: "Grafite", tom: "Neutro", primaria: "#2b2b2b", destaque: "#8c6d3f", fundo: "#f3f3f0", superficie: "#ffffff", texto: "#1a1a1a" },
    { nome: "Petróleo", tom: "Frio", primaria: "#17404a", destaque: "#b5794a", fundo: "#f2f4f1", superficie: "#ffffff", texto: "#162022" },
    { nome: "Café", tom: "Quente", primaria: "#3d2a20", destaque: "#a3783f", fundo: "#f5efe6", superficie: "#fffaf3", texto: "#231b16" }
  ],
  html: (c) => { const { n, e } = c; return `
<div class="faixa-topo"><div class="largura"><span>${e(n.registro)}</span><span>${e(n.contato.endereco)} · <a href="tel:">${e(n.contato.telefone)}</a></span></div></div>
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#"><span class="marca-nome">${e(c.nome)}</span><span class="marca-sub">${e(c.sub)}</span></a>
  <nav aria-label="Principal"><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#processo">${e(n.processo.titulo)}</a><a href="#equipe">${e(n.equipe.titulo)}</a><a href="#contato">Contato</a></nav>
</div></header>
<main>
  <section class="abertura"><div class="largura abertura-grade">
    <div>
      <p class="sobretitulo">${e(n.desde)}</p>
      <h1>${e(c.titulo)}</h1>
      <p class="lide">${e(c.lide)}</p>
      <div class="acoes"><a class="botao" href="#contato">${e(n.cta)}</a><a class="elo" href="#servicos">${e(n.cta2)}</a></div>
    </div>
    <figure class="abertura-foto"><img src="${c.f[0]}" alt="" width="1400" height="930"></figure>
  </div></section>
  <section class="numeros" aria-label="Em números"><div class="largura numeros-grade">
    ${n.numeros.slice(0, 3).map((x) => `<div><strong>${e(x[0])}</strong><span>${e(x[1])}</span></div>`).join("")}
    <blockquote>“${e(n.lema)}”<cite>${e(c.nome)}</cite></blockquote>
  </div></section>
  <section class="areas" id="servicos"><div class="largura">
    <header class="titulo-secao"><h2>${e(n.servicos.titulo)}</h2><p>${e(n.servicos.intro)}</p></header>
    <ol class="areas-lista">${n.servicos.itens.map((x) => `<li><h3>${e(x[0])}</h3><p>${e(x[1])}</p></li>`).join("")}</ol>
  </div></section>
  <section class="compromisso" id="processo"><div class="largura compromisso-grade">
    <img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy">
    <div><h2>${e(n.processo.titulo)}</h2><dl>${n.processo.passos.slice(0, 3).map((x) => `<dt>${e(x[0])}</dt><dd>${e(x[1])}</dd>`).join("")}</dl></div>
  </div></section>
  <section class="socios" id="equipe"><div class="largura">
    <header class="titulo-secao"><h2>${e(n.equipe.titulo)}</h2><p>${e(n.equipe.intro)}</p></header>
    <div class="socios-grade">${c.pessoas.map((p) => `<article><img src="${p.foto}" alt="Retrato de ${e(p.nome)}" width="560" height="680" loading="lazy"><h3>${e(p.nome)}</h3><p class="cargo">${e(p.cargo)}</p><p>${e(p.bio)}</p></article>`).join("")}</div>
  </div></section>
  <section class="contato" id="contato"><div class="largura contato-grade">
    <div><h2>${e(n.contato.titulo)}</h2><p>${e(n.contato.texto)}</p>
      <address><p><b>Endereço</b>${e(n.contato.endereco)}</p><p><b>Atendimento</b>${e(c.horarioTexto)}</p><p><b>Telefone</b>${e(n.contato.telefone)}</p><p><b>E-mail</b>${e(n.contato.email)}</p></address>
    </div>
    ${c.form({ mensagem: true })}
  </div></section>
</main>
<footer class="rodape"><div class="largura"><span class="marca-nome">${e(c.nome)}</span><p>© 2026 ${e(c.nome)} ${e(c.sub)} · ${e(n.registro)} · ${e(n.legal)}</p></div></footer>`; }
};
