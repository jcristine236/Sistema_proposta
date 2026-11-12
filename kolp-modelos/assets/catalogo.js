/* Catálogo KOLP — monta filtros e cartões a partir de dados/modelos.js */
(function () {
  var MODELOS = window.KOLP_MODELOS || [];
  var OPCOES = window.KOLP_FILTROS || {};
  var CFG = window.KOLP_CONFIG || {};
  var GRUPOS = [
    { id: "nicho", titulo: "Nicho", aberto: true },
    { id: "tipo", titulo: "Tipo de site", aberto: true },
    { id: "estilo", titulo: "Estilo", aberto: true },
    { id: "tom", titulo: "Cores", aberto: false },
    { id: "efeitos", titulo: "Efeitos", aberto: false },
    { id: "objetivo", titulo: "Objetivo", aberto: false }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var lista = function (v) { return Array.isArray(v) ? v : v ? [v] : []; };
  var sem = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var zap = function (texto) { return "https://wa.me/" + (CFG.whatsapp || "") + "?text=" + encodeURIComponent(texto); };

  /* Estado: lido da URL para que um link filtrado possa ser enviado ao cliente */
  var estado = { busca: "", ordem: "codigo" };
  GRUPOS.forEach(function (g) { estado[g.id] = []; });
  var q = new URLSearchParams(location.search);
  GRUPOS.forEach(function (g) { if (q.get(g.id)) estado[g.id] = q.get(g.id).split("|"); });
  estado.busca = q.get("busca") || "";
  estado.ordem = q.get("ordem") || "codigo";

  function gravarUrl() {
    var p = new URLSearchParams();
    GRUPOS.forEach(function (g) { if (estado[g.id].length) p.set(g.id, estado[g.id].join("|")); });
    if (estado.busca) p.set("busca", estado.busca);
    if (estado.ordem !== "codigo") p.set("ordem", estado.ordem);
    var s = p.toString();
    history.replaceState(null, "", s ? "?" + s : location.pathname);
  }

  /* Um modelo passa quando, em cada grupo com seleção, tem pelo menos uma das opções marcadas */
  function passa(m, ignorar) {
    var okGrupos = GRUPOS.every(function (g) {
      if (g.id === ignorar || !estado[g.id].length) return true;
      var doModelo = lista(m[g.id]);
      return estado[g.id].some(function (o) { return doModelo.indexOf(o) > -1; });
    });
    if (!okGrupos) return false;
    if (!estado.busca) return true;
    var texto = sem([m.codigo, m.nome, m.resumo, m.nicho, m.tipo].concat(lista(m.estilo), lista(m.secoes), lista(m.objetivo)).join(" "));
    return sem(estado.busca).split(/\s+/).every(function (t) { return texto.indexOf(t) > -1; });
  }

  function montarFiltros() {
    $("grupos").innerHTML = GRUPOS.map(function (g) {
      var total = {};
      MODELOS.forEach(function (m) { lista(m[g.id]).forEach(function (o) { total[o] = 1; }); });
      var opcoes = (OPCOES[g.id] || Object.keys(total)).slice();
      Object.keys(total).forEach(function (o) { if (opcoes.indexOf(o) < 0) opcoes.push(o); });
      var aberto = g.aberto || estado[g.id].length;
      return '<details class="grupo"' + (aberto ? " open" : "") + "><summary>" + g.titulo + "</summary><ul>" +
        opcoes.map(function (o) {
          return '<li><label><input type="checkbox" data-grupo="' + g.id + '" value="' + esc(o) + '"' +
            (estado[g.id].indexOf(o) > -1 ? " checked" : "") + "><span>" + esc(o) + "</span><small></small></label></li>";
        }).join("") + "</ul></details>";
    }).join("");
  }

  function cartao(m) {
    var link = "demo/" + m.pasta + "/";
    var msg = (CFG.mensagem || "Quero o modelo {codigo}").replace("{codigo}", m.codigo).replace("{nome}", m.nome);
    return '<li class="cartao">' +
      '<a class="janela" href="' + link + '" aria-label="Ver demonstração do modelo ' + esc(m.nome) + '">' +
        '<img src="miniaturas/' + m.pasta + '.jpg" alt="" loading="lazy" width="640" height="440"></a>' +
      '<div class="cartao-topo"><span class="codigo">' + m.codigo + '</span><span class="paletas" title="Paletas prontas">' +
        m.paletas.map(function (p) { return '<i style="background:' + p.primaria + '" title="' + esc(p.nome) + '"></i>'; }).join("") + "</span></div>" +
      '<h3><a href="' + link + '">' + esc(m.nome) + "</a></h3>" +
      '<p class="meta">' + esc(m.nicho) + " · " + esc(m.tipo) + "</p>" +
      '<p class="resumo">' + esc(m.resumo) + "</p>" +
      '<ul class="tags">' + lista(m.estilo).concat(lista(m.efeitos)).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<div class="acoes"><a href="' + link + '">Ver demonstração</a><a class="quero" target="_blank" rel="noopener" href="' + zap(msg) + '">Quero este</a></div>' +
      "</li>";
  }

  function desenhar() {
    var visiveis = MODELOS.filter(function (m) { return passa(m); });
    var ordenar = {
      codigo: function (a, b) { return a.codigo.localeCompare(b.codigo); },
      recentes: function (a, b) { return b.codigo.localeCompare(a.codigo); },
      nome: function (a, b) { return a.nome.localeCompare(b.nome, "pt"); },
      nicho: function (a, b) { return a.nicho.localeCompare(b.nicho, "pt") || a.codigo.localeCompare(b.codigo); }
    }[estado.ordem] || null;
    if (ordenar) visiveis.sort(ordenar);

    $("grade").innerHTML = visiveis.map(cartao).join("");
    $("vazio").hidden = visiveis.length > 0;
    $("contagem").innerHTML = "<b>" + visiveis.length + "</b> de " + MODELOS.length + (MODELOS.length === 1 ? " modelo" : " modelos");

    /* Contagem ao lado de cada opção: quantos modelos sobram se ela for marcada */
    document.querySelectorAll("#grupos input").forEach(function (c) {
      var g = c.dataset.grupo, o = c.value;
      var existe = MODELOS.some(function (m) { return lista(m[g]).indexOf(o) > -1; });
      var n = MODELOS.filter(function (m) { return lista(m[g]).indexOf(o) > -1 && passa(m, g); }).length;
      var rotulo = c.closest("label");
      rotulo.classList.toggle("zero", !existe);
      c.disabled = !existe;
      rotulo.querySelector("small").textContent = existe ? n : "em breve";
    });

    var ativos = [];
    GRUPOS.forEach(function (g) { estado[g.id].forEach(function (o) { ativos.push({ g: g.id, o: o }); }); });
    $("ativos").innerHTML = ativos.map(function (a) {
      return '<li><button type="button" data-grupo="' + a.g + '" data-valor="' + esc(a.o) + '" aria-label="Remover filtro ' + esc(a.o) + '">' + esc(a.o) + "</button></li>";
    }).join("");
    $("limpar").hidden = !ativos.length && !estado.busca;
    $("qtd-filtros").textContent = ativos.length || "";
    $("aplicar").textContent = "Ver " + visiveis.length + (visiveis.length === 1 ? " modelo" : " modelos");
    gravarUrl();
  }

  function limpar() {
    GRUPOS.forEach(function (g) { estado[g.id] = []; });
    estado.busca = ""; $("busca").value = "";
    document.querySelectorAll("#grupos input").forEach(function (c) { c.checked = false; });
    desenhar();
  }

  montarFiltros();
  $("busca").value = estado.busca;
  $("ordem").value = estado.ordem;
  $("falar").href = zap("Olá! Vi o catálogo de modelos da KOLP e quero conversar sobre o meu site.");
  desenhar();

  $("grupos").addEventListener("change", function (e) {
    var c = e.target, g = c.dataset.grupo;
    if (!g) return;
    estado[g] = estado[g].filter(function (o) { return o !== c.value; });
    if (c.checked) estado[g].push(c.value);
    desenhar();
  });
  $("ativos").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    estado[b.dataset.grupo] = estado[b.dataset.grupo].filter(function (o) { return o !== b.dataset.valor; });
    document.querySelectorAll('#grupos input[data-grupo="' + b.dataset.grupo + '"]').forEach(function (c) { if (c.value === b.dataset.valor) c.checked = false; });
    desenhar();
  });
  $("busca").addEventListener("input", function (e) { estado.busca = e.target.value.trim(); desenhar(); });
  $("ordem").addEventListener("change", function (e) { estado.ordem = e.target.value; desenhar(); });
  $("limpar").addEventListener("click", limpar);
  $("limpar2").addEventListener("click", limpar);

  /* Filtros em tela cheia no celular */
  function gaveta(abrir) { $("filtros").classList.toggle("aberto", abrir); document.body.style.overflow = abrir ? "hidden" : ""; }
  $("abrir").addEventListener("click", function () { gaveta(true); });
  $("fechar").addEventListener("click", function () { gaveta(false); });
  $("aplicar").addEventListener("click", function () { gaveta(false); });
})();
