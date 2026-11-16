module.exports = {
  nome: "Leve",
  resumo: "Layout claro e arredondado para {nicho}: formulário logo na abertura, lista de preços e perguntas frequentes.",
  tipo: "Landing page", estilo: ["Moderno"], efeitos: ["Animação ao rolar"], objetivo: ["Agendamento", "WhatsApp"], anima: true,
  fontes: "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&display=swap",
  paletas: [
    { nome: "Verde-água", tom: "Frio", primaria: "#0f6e6a", destaque: "#f2a65a", fundo: "#f2f7f6", superficie: "#ffffff", texto: "#12292b" },
    { nome: "Azul", tom: "Frio", primaria: "#1d5fa8", destaque: "#f0b64a", fundo: "#f3f6fa", superficie: "#ffffff", texto: "#14233a" },
    { nome: "Rosa antigo", tom: "Quente", primaria: "#a8506a", destaque: "#e0a458", fundo: "#faf4f3", superficie: "#ffffff", texto: "#2e1c22" },
    { nome: "Lavanda", tom: "Frio", primaria: "#5b54a0", destaque: "#e99a6b", fundo: "#f5f4fa", superficie: "#ffffff", texto: "#1f1d33" },
    { nome: "Coral", tom: "Quente", primaria: "#c9553d", destaque: "#2f7f78", fundo: "#fbf5f1", superficie: "#ffffff", texto: "#2b1d18" },
    { nome: "Musgo", tom: "Neutro", primaria: "#4d6a3a", destaque: "#d99a3c", fundo: "#f4f6f0", superficie: "#ffffff", texto: "#1c2416" }
  ],
  html: (c) => { const { n, e } = c; return `
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#"><span class="marca-sinal" aria-hidden="true"></span>${e(c.nome)}</a>
  <nav aria-label="Principal"><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#processo">${e(n.processo.titulo)}</a><a href="#equipe">${e(n.equipe.titulo)}</a><a href="#duvidas">Dúvidas</a></nav>
  <a class="telefone" href="tel:">${e(n.contato.telefone)}</a>
</div></header>
<main>
  <section class="abertura"><div class="largura abertura-grade">
    <div class="abertura-texto">
      <p class="etiqueta">${e(n.local)}</p>
      <h1>${e(c.titulo)}</h1>
      <p class="lide">${e(c.lide)}</p>
      <ul class="pontos">${n.pontos.map((x) => `<li>${e(x)}</li>`).join("")}</ul>
      <p class="convenios"><span>Atendimento</span> ${e(c.horarioTexto)}</p>
    </div>
    <div class="abertura-lado">
      <img src="${c.f[0]}" alt="" width="1400" height="930">
      ${c.form({ classe: "agenda", titulo: n.cta, botao: "Enviar pedido" })}
    </div>
  </div></section>
  <section class="tratamentos" id="precos"><div class="largura tratamentos-grade">
    <header class="rev"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p><img src="${c.f[1]}" alt="" width="1400" height="930" loading="lazy"></header>
    <ul class="lista-tratamentos">${c.itens.slice(0, 7).map((x) => `<li class="rev"><div><h3>${e(x.nome)}</h3><p>${e(x.desc)}</p></div><span>${e(x.grupo)}<b>${e(x.valor)}</b></span></li>`).join("")}</ul>
  </div></section>
  <section class="consulta" id="processo"><div class="largura">
    <h2 class="rev">${e(n.processo.titulo)}</h2>
    <ol class="passos">${n.processo.passos.map((x) => `<li class="rev"><b>${e(x[0])}</b><p>${e(x[1])}</p></li>`).join("")}</ol>
  </div></section>
  <section class="equipe" id="equipe"><div class="largura equipe-grade">
    <div class="rev"><h2>${e(n.equipe.titulo)}</h2><p>${e(n.equipe.intro)}</p><img class="equipe-foto" src="${c.f[2]}" alt="" width="1400" height="930" loading="lazy"></div>
    <div class="pessoas">${c.pessoas.slice(0, 2).map((p) => `<article class="rev"><img src="${p.foto}" alt="${e(p.nome)}" width="560" height="680" loading="lazy"><div><h3>${e(p.nome)}</h3><p class="cargo">${e(p.cargo)}</p><p>${e(p.bio)}</p></div></article>`).join("")}</div>
  </div></section>
  <section class="duvidas" id="duvidas"><div class="largura duvidas-grade">
    <h2 class="rev">Perguntas frequentes</h2>
    <div class="rev">${n.faq.map((x, i) => `<details${i ? "" : " open"}><summary>${e(x[0])}</summary><p>${e(x[1])}</p></details>`).join("")}</div>
  </div></section>
  <section class="chamada"><div class="largura chamada-caixa rev">
    <div><h2>${e(n.contato.titulo)}</h2><p>${e(n.contato.texto)}</p></div>
    <a class="botao botao-claro" href="${c.zap()}">Chamar no WhatsApp</a>
  </div></section>
</main>
<footer class="rodape"><div class="largura">
  <div><a class="marca" href="#"><span class="marca-sinal" aria-hidden="true"></span>${e(c.nome)}</a><p>${e(n.contato.endereco)}</p></div>
  <p>${n.contato.horario.map((h) => e(h[0] + ", " + h[1])).join("<br>")}</p>
  <p>${e(n.registro)}<br>${e(n.contato.email)}</p>
</div></footer>`; }
};
