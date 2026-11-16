module.exports = {
  nome: "Corporativo",
  resumo: "Layout sóbrio para {nicho}: pedido de proposta na abertura, indicadores, tabela de serviços e colunas de preços.",
  tipo: "Página de captura", estilo: ["Corporativo", "Moderno"], efeitos: ["Sem efeitos"], objetivo: ["Orçamento", "Formulário de contato"],
  fontes: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
  paletas: [
    { nome: "Marinho e verde", tom: "Frio", primaria: "#14305a", destaque: "#1f8a5b", fundo: "#f4f5f7", superficie: "#ffffff", texto: "#141a24" },
    { nome: "Petróleo", tom: "Frio", primaria: "#0f4350", destaque: "#d98a2b", fundo: "#f3f6f6", superficie: "#ffffff", texto: "#10201f" },
    { nome: "Grafite e azul", tom: "Neutro", primaria: "#23272e", destaque: "#2f6fde", fundo: "#f5f5f5", superficie: "#ffffff", texto: "#16181c" },
    { nome: "Verde-floresta", tom: "Neutro", primaria: "#1c4332", destaque: "#b9862f", fundo: "#f4f6f2", superficie: "#ffffff", texto: "#141c17" },
    { nome: "Vinho e cobre", tom: "Quente", primaria: "#4a1d2a", destaque: "#c0703a", fundo: "#f7f4f3", superficie: "#ffffff", texto: "#201618" },
    { nome: "Azul-real", tom: "Frio", primaria: "#1a3fa0", destaque: "#e0652e", fundo: "#f3f5fa", superficie: "#ffffff", texto: "#121a2e" }
  ],
  html: (c) => { const { n, e } = c; const sigla = c.nome.charAt(0) + "/"; return `
<header class="cabecalho"><div class="largura">
  <a class="marca" href="#"><span aria-hidden="true">${e(sigla)}</span>${e(c.nome)}</a>
  <nav aria-label="Principal"><a href="#servicos">${e(n.servicos.titulo)}</a><a href="#precos">${e(n.catalogo.titulo)}</a><a href="#processo">${e(n.processo.titulo)}</a></nav>
  <a class="botao botao-pequeno" href="#proposta">${e(n.cta)}</a>
</div></header>
<main>
  <section class="abertura" id="proposta">
    <div class="largura abertura-grade">
      <div>
        <p class="registro">${e(n.registro)} · ${e(n.local)}</p>
        <h1>${e(c.titulo)}</h1>
        <p class="lide">${e(c.lide)}</p>
        <ul class="garantias">${n.pontos.slice(0, 2).map((x) => `<li><b>${e(x)}</b></li>`).join("")}</ul>
      </div>
      ${c.form({ classe: "proposta", titulo: n.cta, texto: "Resposta em até um dia útil.", assunto: "Pedido de proposta", botao: "Enviar pedido" })}
    </div>
    <div class="largura"><dl class="razao">${n.numeros.map((x) => `<div><dt>${e(x[1])}</dt><dd>${e(x[0])}</dd></div>`).join("")}</dl></div>
  </section>
  <section class="servicos" id="servicos"><div class="largura">
    <header class="topo-secao"><h2>${e(n.servicos.titulo)}</h2><p>${e(n.servicos.intro)}</p></header>
    <div class="tabela-rolagem"><table><thead><tr><th>Serviço</th><th>O que está incluído</th></tr></thead>
      <tbody>${n.servicos.itens.map((x) => `<tr><th>${e(x[0])}</th><td>${e(x[1])}</td></tr>`).join("")}</tbody></table></div>
  </div></section>
  <section class="planos" id="precos"><div class="largura">
    <header class="topo-secao"><h2>${e(n.catalogo.titulo)}</h2><p>${e(n.catalogo.intro)}</p></header>
    <div class="planos-grade">${n.catalogo.grupos.map((g, i) => `<article${i === 1 ? ' class="recomendado"' : ""}>${i === 1 ? '<p class="selo">Mais procurado</p>' : ""}<h3>${e(g.nome)}</h3>
      <ul>${g.itens.map((x) => `<li><b>${e(x[2])}</b>${e(x[0])}<small>${e(x[1])}</small></li>`).join("")}</ul>
      <a class="botao${i === 1 ? "" : " botao-contorno"}" href="#proposta">${e(n.cta)}</a></article>`).join("")}</div>
  </div></section>
  <section class="calendario" id="processo"><div class="largura calendario-grade">
    <div><h2>${e(n.processo.titulo)}</h2><p>${e(n.lema)}</p><img src="${c.f[0]}" alt="" width="1400" height="930" loading="lazy"></div>
    <ol class="datas">${n.processo.passos.map((x, i) => `<li><time>0${i + 1}</time><div><b>${e(x[0])}</b><span>${e(x[1])}</span></div></li>`).join("")}</ol>
  </div></section>
  <section class="depoimento"><div class="largura depoimento-grade">
    <img src="${c.depoFoto}" alt="" width="300" height="300" loading="lazy">
    <blockquote><p>“${e(n.depoimento[0])}”</p><footer><b>${e(n.depoimento[1])}</b> · ${e(n.depoimento[2])}</footer></blockquote>
  </div></section>
</main>
<footer class="rodape"><div class="largura">
  <div><a class="marca" href="#"><span aria-hidden="true">${e(sigla)}</span>${e(c.nome)}</a><p>${e(n.registro)}</p></div>
  <p>${e(n.contato.endereco)}</p>
  <p>${e(n.contato.telefone)}<br>${e(n.contato.email)}<br>${e(c.horarioTexto)}</p>
</div></footer>`; }
};
