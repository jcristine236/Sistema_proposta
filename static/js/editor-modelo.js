// Editor visual de modelos e de seções avulsas (antes EditorModelo.tsx, CamposBloco.tsx e
// EditorFormulario.tsx). Arraste blocos da paleta para a área central, reordene, edite as
// propriedades à direita e veja a prévia. O HTML de cada bloco (e a prévia inteira) vem do
// servidor, com os mesmos templates da página pública; aqui fica só o estado e a montagem.
//
// Edição de texto altera o estado no lugar, sem redesenhar o painel (para não perder o
// foco); mudanças de estrutura (adicionar, mover, remover, trocar de aba) redesenham a parte
// afetada, com a mesma marcação que o React gerava.
(function () {
  "use strict";

  var cfgEl = document.getElementById("config-editor");
  var raiz = document.querySelector("[data-editor]");
  if (!cfgEl || !raiz) return;
  var cfg = JSON.parse(cfgEl.textContent);
  var modo = cfg.modo;
  var podeEditar = cfg.podeEditar;
  var CAT = cfg.blocos;
  var BLOCOS = CAT.blocos;
  var BLOCO = {};
  BLOCOS.forEach(function (b) { BLOCO[b.tipo] = b; });
  var ICONES = cfg.icones;
  var NOME_TIPO = {};
  CAT.tiposCampo.forEach(function (t) { NOME_TIPO[t.tipo] = t.nome; });
  var CATEGORIAS = ["Estrutura", "Conteúdo", "Mídia", "Comercial", "Credibilidade"];

  // ------------------------------------------------------------- estado
  var m = cfg.inicial;
  var sel = m.secoes.length ? 0 : null;
  var aba = "secoes";
  var abaProp = "conteudo";
  var alvo = null;
  var alterado = false;
  var salvando = false;
  var msg = {};
  var favoritas = cfg.favoritas;
  var nomeSecao = m.nome;
  var arraste = null;
  var fimPrevia = null;

  // ------------------------------------------------------------- utilidades
  function h(tag, attrs, filhos) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "texto") el.textContent = v;
      else if (k === "valor") el.value = v;
      else if (k === "marcado") el.checked = !!v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined || f === false || f === "") return;
      el.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return el;
  }
  function svg(nome, comAria) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("class", "ic ed-ic");
    s.setAttribute("viewBox", "0 0 24 24");
    if (comAria) s.setAttribute("aria-hidden", "true");
    s.innerHTML = ICONES[nome] || ICONES.check; // marcação dos ícones vem do nosso catálogo
    return s;
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function novoId(tipo) { return tipo + "-" + Math.random().toString(36).slice(2, 8); }
  function csrf() {
    var x = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return x ? decodeURIComponent(x[1]) : "";
  }
  function postar(url, corpo) {
    return fetch(url, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
      body: JSON.stringify(corpo),
    }).then(function (r) { return r.json().catch(function () { return {}; }); }, function () { return {}; });
  }
  function lerCaminho(obj, k) {
    return k.split(".").reduce(function (o, p) { return o && typeof o === "object" ? o[p] : undefined; }, obj);
  }
  function escreverCaminho(obj, k, v) {
    var partes = k.split(".");
    var r = Object.assign({}, obj);
    var atual = r;
    partes.forEach(function (p, i) {
      if (i === partes.length - 1) atual[p] = v;
      else {
        var prox = Object.assign({}, atual[p] || {});
        atual[p] = prox;
        atual = prox;
      }
    });
    return r;
  }
  // Valor de <select> como o React controla: sem opção igual, fica a primeira
  function valorSelect(el, v) {
    el.value = v;
    if (el.selectedIndex < 0 && el.options.length) el.selectedIndex = 0;
  }
  function select(opcoes, valor, onChange, attrs) {
    var el = h("select", Object.assign({ onchange: function () { onChange(el.value); } }, attrs || {}),
      opcoes.map(function (o) { return h("option", { value: o.v, texto: o.r }); }));
    valorSelect(el, valor);
    return el;
  }

  // Toda edição do usuário passa por aqui (marca "não salvo", limpa mensagens, re-renderiza)
  function mudou() {
    alterado = true;
    msg = {};
    desenharTopo();
    agendarRender();
  }
  window.addEventListener("beforeunload", function (e) { if (alterado) e.preventDefault(); });

  // ------------------------------------------------- HTML dos blocos (servidor)
  var htmlBloco = {}; // id da seção -> HTML do servidor
  var renderEl = {}; // id da seção -> div.ed-render (reaproveitado entre redesenhos)
  var timerRender = null;
  var seqRender = 0;
  function agendarRender() {
    clearTimeout(timerRender);
    timerRender = setTimeout(renderizarBlocos, 250);
  }
  function renderizarBlocos() {
    var seq = ++seqRender;
    var secoes = m.secoes.slice();
    postar(cfg.urlRender, { campos: m.campos, precificacao: m.precificacao, secoes: secoes }).then(function (j) {
      if (seq !== seqRender || !j.blocos) return; // resposta atrasada
      secoes.forEach(function (s, i) {
        var html = j.blocos[i];
        if (htmlBloco[s.id] === html) return;
        htmlBloco[s.id] = html;
        if (renderEl[s.id]) definirHtml(renderEl[s.id], html);
      });
    });
  }
  function definirHtml(el, html) {
    el.innerHTML = html; // HTML do nosso servidor
    if (window.ajustarLogos) window.ajustarLogos(el); // logo da capa (painel.js)
  }
  function elRender(s) {
    if (!renderEl[s.id]) {
      renderEl[s.id] = h("div", { class: "ed-render" });
      if (htmlBloco[s.id] !== undefined) definirHtml(renderEl[s.id], htmlBloco[s.id]);
    }
    return renderEl[s.id];
  }

  // ------------------------------------------------------------- topo
  var elTopo = h("div", { class: "ed-topo" });
  // Mensagens e corpo ficam direto dentro de .editor, como no React
  var elMsgs = [];
  var elCorpo = null;
  raiz.appendChild(elTopo);

  var inputNome = h("input", {
    class: "ed-nome", valor: modo === "modelo" ? m.nome : nomeSecao,
    placeholder: modo === "modelo" ? "Nome do modelo" : "Nome da seção", disabled: !podeEditar,
    oninput: function () {
      if (modo === "modelo") m.nome = inputNome.value;
      else nomeSecao = inputNome.value;
      if (modo === "modelo") mudou();
      else { alterado = true; desenharTopo(); }
    },
  });
  var chipNaoSalvo = h("span", { class: "chip", texto: "não salvo" });
  var infoTopo = h("div", { class: "ed-topo-info" }, [
    h("a", { href: modo === "secao" ? "/admin/modelos?aba=secoes" : "/admin/modelos", class: "muted", texto: "← Modelos" }),
    inputNome,
  ]);
  var abasTopo = modo === "modelo" ? h("div", { class: "abas" }) : null;
  var botaoSalvar = podeEditar ? h("button", { class: "btn destaque", type: "button", onclick: salvar }) : null;
  var botoesTopo = h("div", { style: "display:flex;gap:8px" }, [
    h("button", {
      class: "btn claro", type: "button", title: "Baixar a definição do modelo (para backup ou para continuar com o Claude)",
      onclick: exportar, texto: "Exportar JSON",
    }),
    botaoSalvar,
  ]);
  elTopo.appendChild(infoTopo);
  if (abasTopo) elTopo.appendChild(abasTopo);
  elTopo.appendChild(botoesTopo);

  function desenharTopo() {
    if (alterado && !chipNaoSalvo.parentNode) infoTopo.appendChild(chipNaoSalvo);
    if (!alterado && chipNaoSalvo.parentNode) chipNaoSalvo.remove();
    if (abasTopo) {
      abasTopo.innerHTML = "";
      [["secoes", "Seções"], ["formulario", "Formulário"], ["calculo", "Cálculo"], ["previa", "Prévia"]].forEach(function (a) {
        abasTopo.appendChild(h("button", { type: "button", class: aba === a[0] ? "on" : "", texto: a[1],
          onclick: function () { trocarAba(a[0]); } }));
      });
    }
    if (botaoSalvar) {
      botaoSalvar.textContent = salvando ? "Salvando..." : "Salvar";
      botaoSalvar.disabled = salvando;
    }
    elMsgs.forEach(function (x) { x.remove(); });
    elMsgs = [];
    if (msg.erro) elMsgs.push(h("div", { class: "alerta erro", texto: msg.erro }));
    if (msg.ok) elMsgs.push(h("div", { class: "alerta ok", texto: msg.ok }));
    elMsgs.forEach(function (x) { raiz.insertBefore(x, elCorpo); });
  }

  function exportar() {
    var dados = modo === "secao" ? { nome: nomeSecao, secao: m.secoes[0] } : m;
    var blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ((modo === "secao" ? nomeSecao : m.nome).replace(/[^\w-]+/g, "-").toLowerCase() || "modelo") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function salvar() {
    salvando = true;
    msg = {};
    desenharTopo();
    var corpo;
    if (modo === "secao") {
      if (!m.secoes[0]) {
        salvando = false;
        msg = { erro: "Adicione um bloco." };
        return desenharTopo();
      }
      corpo = { nome: nomeSecao, secao: m.secoes[0] };
    } else {
      corpo = { modelo: m };
    }
    postar(cfg.urlSalvar, corpo).then(function (r) {
      salvando = false;
      if (r.erro || !r.id) msg = { erro: r.erro || "Não foi possível salvar. Tente novamente." };
      else {
        alterado = false;
        msg = { ok: modo === "secao" ? "Seção salva." : "Modelo salvo." };
      }
      desenharTopo();
    });
  }

  function favoritar(s) {
    var nome = window.prompt("Nome da seção favorita:",
      (BLOCO[s.tipo] ? BLOCO[s.tipo].nome : "undefined") + ((s.titulo) ? " — " + String(s.titulo).slice(0, 40) : ""));
    if (!nome) return;
    postar(cfg.urlFavorita, { nome: nome, secao: s }).then(function (r) {
      if (r.erro || !r.id) {
        msg = { erro: r.erro || "Não foi possível salvar. Tente novamente." };
        return desenharTopo();
      }
      favoritas.push({ id: r.id, nome: nome, secao: clone(s) });
      msg = { ok: "“" + nome + "” salva em Minhas seções." };
      desenharTopo();
      if (aba === "secoes") desenharPaleta();
    });
  }

  function trocarAba(a) {
    if (fimPrevia) { fimPrevia(); fimPrevia = null; }
    aba = a;
    desenharTopo();
    desenharCorpo();
  }

  // ------------------------------------------------------------- corpo
  var elPaleta, elCanvas, elProps;

  function desenharCorpo() {
    if (elCorpo) elCorpo.remove();
    if (aba === "formulario") elCorpo = editorCampos();
    else if (aba === "calculo") elCorpo = editorCalculo();
    else if (aba === "previa") elCorpo = previa();
    if (aba !== "secoes") return raiz.appendChild(elCorpo);
    elPaleta = h("aside", { class: "ed-paleta" });
    elCanvas = h("section", {
      class: "ed-canvas",
      ondragover: function (e) { e.preventDefault(); if (!m.secoes.length) setAlvo(0); },
      ondrop: function () { soltar(alvo !== null ? alvo : m.secoes.length); },
      ondragleave: function (e) { if (e.currentTarget === e.target) setAlvo(null); },
    });
    elProps = h("aside", { class: "ed-props" });
    elCorpo = h("div", { class: "ed-grade" }, [elPaleta, elCanvas, elProps]);
    raiz.appendChild(elCorpo);
    desenharPaleta();
    desenharCanvas();
    desenharProps();
  }

  function previa() {
    var moldura = h("div", { class: "previa-moldura" });
    postar(cfg.urlRender, { campos: m.campos, precificacao: m.precificacao, secoes: m.secoes, completa: true }).then(function (j) {
      if (aba !== "previa" || !moldura.parentNode) return;
      definirHtml(moldura, j.html || "");
      var pp = moldura.querySelector("[data-proposta]");
      if (pp && window.iniciarProposta) fimPrevia = window.iniciarProposta(pp);
    });
    return moldura;
  }

  // ------------------------------------------------------------- paleta
  function inserir(s, pos) {
    if (modo === "secao") {
      m.secoes = [s];
      sel = 0;
    } else {
      m.secoes.splice(pos, 0, s);
      sel = pos;
    }
    mudou();
    desenharCanvas();
    desenharProps();
  }
  function deBloco(tipo) { return Object.assign(clone(BLOCO[tipo].padrao), { id: novoId(tipo) }); }
  function deFavorita(id) {
    var f = favoritas.filter(function (x) { return x.id === id; })[0];
    return f ? Object.assign(clone(f.secao), { id: novoId(f.secao.tipo) }) : null;
  }
  function posPadrao() { return sel === null ? m.secoes.length : sel + 1; }

  function itemPaleta(attrs, filhos, inicioArraste, clique) {
    return h("div", Object.assign({
      draggable: podeEditar ? "true" : "false",
      ondragstart: function (e) { arraste = inicioArraste; if (e.dataTransfer) e.dataTransfer.setData("text/plain", ""); },
      onclick: clique,
    }, attrs), filhos);
  }

  function desenharPaleta() {
    elPaleta.innerHTML = "";
    if (modo === "modelo") {
      elPaleta.appendChild(h("div", { class: "card ed-config" }, [
        h("div", { class: "campo" }, [h("label", { texto: "Descrição" }),
          h("input", { valor: m.descricao, oninput: function (e) { m.descricao = e.target.value; mudou(); } })]),
        h("div", { class: "campo" }, [h("label", { texto: "Tipo de solução" }),
          h("input", { valor: m.tipoSolucao, oninput: function (e) { m.tipoSolucao = e.target.value; mudou(); } })]),
      ]));
    }
    elPaleta.appendChild(h("div", { class: "ed-titulo-paleta" }, ["Blocos ", h("span", { class: "muted", texto: "· arraste ou clique" })]));
    CATEGORIAS.forEach(function (cat) {
      elPaleta.appendChild(h("div", { class: "ed-cat" }, [h("div", { class: "ed-cat-nome", texto: cat })].concat(
        BLOCOS.filter(function (b) { return b.categoria === cat; }).map(function (b) {
          return itemPaleta({ class: "ed-bloco-paleta", title: b.descricao }, [svg(b.icone, true), " ", b.nome],
            { tipo: "novo", bloco: b.tipo },
            function () { if (podeEditar) inserir(deBloco(b.tipo), posPadrao()); });
        }))));
    });
    elPaleta.appendChild(h("div", { class: "ed-cat" }, [
      h("div", { class: "ed-cat-nome", texto: "Minhas seções" }),
      favoritas.length === 0 ? h("div", { class: "muted", style: "font-size:12.5px;padding:4px 2px", texto: "Use ★ numa seção para salvá-la aqui." }) : null,
    ].concat(favoritas.map(function (f) {
      return itemPaleta({ class: "ed-bloco-paleta fav" }, ["★ ", f.nome], { tipo: "fav", id: f.id },
        function () { var s = deFavorita(f.id); if (s && podeEditar) inserir(s, posPadrao()); });
    }))));
  }

  // ------------------------------------------------------------- canvas
  // Durante o arraste só a marca de inserção muda (os blocos ficam no lugar)
  var wraps = [];
  function setAlvo(v) {
    if (alvo === v) return;
    alvo = v;
    marcar();
  }
  function marcar() {
    if (!elCanvas) return;
    elCanvas.querySelectorAll(":scope > .ed-marca, :scope > .ed-wrap > .ed-marca").forEach(function (x) { x.remove(); });
    if (alvo === null) return;
    if (alvo < wraps.length) wraps[alvo].insertBefore(h("div", { class: "ed-marca" }), wraps[alvo].firstChild);
    else if (alvo === m.secoes.length && m.secoes.length > 0) elCanvas.appendChild(h("div", { class: "ed-marca" }));
  }
  function soltar(pos) {
    var a = arraste;
    arraste = null;
    alvo = null;
    if (!a || !podeEditar) return desenharCanvas();
    if (a.tipo === "novo") return inserir(deBloco(a.bloco), pos);
    if (a.tipo === "fav") {
      var s = deFavorita(a.id);
      return s ? inserir(s, pos) : desenharCanvas();
    }
    var item = m.secoes.splice(a.de, 1)[0];
    var destino = a.de < pos ? pos - 1 : pos;
    m.secoes.splice(destino, 0, item);
    sel = destino;
    mudou();
    desenharCanvas();
    desenharProps();
  }
  function sobre(e, i) {
    e.preventDefault();
    var r = e.currentTarget.getBoundingClientRect();
    setAlvo(e.clientY < r.top + r.height / 2 ? i : i + 1);
  }
  function trocar(i, j) {
    var l = m.secoes;
    var x = l[i];
    l[i] = l[j];
    l[j] = x;
    sel = j;
    mudou();
    desenharCanvas();
    desenharProps();
  }
  function botaoAcao(titulo, texto, fn) {
    return h("button", { type: "button", title: titulo, texto: texto, onclick: fn });
  }

  function desenharCanvas() {
    if (!elCanvas) return;
    elCanvas.innerHTML = "";
    wraps = [];
    if (m.secoes.length === 0) {
      elCanvas.appendChild(h("div", { class: "ed-vazio", texto: "Arraste um bloco para cá" + (modo === "modelo" ? " (comece pela Capa)" : "") + "." }));
    }
    m.secoes.forEach(function (s, i) {
      var acoes = null;
      if (podeEditar) {
        acoes = h("span", { class: "ed-acoes", onclick: function (e) { e.stopPropagation(); } }, modo === "modelo" ? [
          botaoAcao("Subir", "↑", function () { if (i > 0) trocar(i, i - 1); }),
          botaoAcao("Descer", "↓", function () { if (i < m.secoes.length - 1) trocar(i, i + 1); }),
          botaoAcao("Duplicar", "⧉", function () { var x = m.secoes[i]; inserir(Object.assign(clone(x), { id: novoId(x.tipo) }), i + 1); }),
          botaoAcao("Salvar como seção favorita", "★", function () { favoritar(m.secoes[i]); }),
        ] : []);
        acoes.appendChild(botaoAcao("Excluir", "🗑", function () {
          m.secoes = m.secoes.filter(function (_, j) { return j !== i; });
          sel = null;
          mudou();
          desenharCanvas();
          desenharProps();
        }));
      }
      var barra = h("div", {
        class: "ed-barra", draggable: podeEditar && modo === "modelo" ? "true" : "false",
        ondragstart: function (e) { arraste = { tipo: "mover", de: i }; if (e.dataTransfer) e.dataTransfer.setData("text/plain", ""); },
      }, [
        h("span", { class: "ed-alca", title: "Arraste para mover", texto: "⋮⋮" }),
        h("b", { texto: BLOCO[s.tipo] ? BLOCO[s.tipo].nome : s.tipo }),
        h("span", { class: "muted", "data-capitulo": true }),
        acoes,
      ]);
      var bloco = h("div", {
        class: "ed-bloco " + (sel === i ? "sel" : ""),
        ondragover: function (e) { sobre(e, i); },
        ondrop: function (e) { e.stopPropagation(); soltar(alvo !== null ? alvo : i); },
        // Só troca a classe: redesenhar o canvas recarregaria os vídeos (iframes)
        onclick: function () { if (sel !== i) { sel = i; marcarSel(); desenharProps(); } },
      }, [barra, elRender(s)]);
      atualizarCapitulo(barra, s);
      var wrap = h("div", { class: "ed-wrap" }, [bloco]);
      wraps.push(wrap);
      elCanvas.appendChild(wrap);
    });
    marcar();
  }

  // ------------------------------------------------------------- propriedades
  function atual() { return sel !== null ? m.secoes[sel] : null; }
  function atualizarCapitulo(barra, s) {
    var el = barra.querySelector("[data-capitulo]");
    el.textContent = s.capitulo ? "· " + s.capitulo : "";
    el.hidden = !s.capitulo;
  }
  function marcarSel() {
    wraps.forEach(function (w, j) { w.querySelector(".ed-bloco").className = "ed-bloco " + (sel === j ? "sel" : ""); });
  }
  function setAtual(s) {
    if (sel === null) return;
    m.secoes[sel] = s;
    mudou();
    // Atualiza só a barra do bloco (o HTML do bloco vem do servidor em seguida)
    if (wraps[sel]) atualizarCapitulo(wraps[sel].querySelector(".ed-barra"), s);
  }

  function variaveis() {
    var l = ["{{cliente}}", "{{validade}}", "{{empresa.nome}}"];
    m.campos.filter(function (c) { return c.tipo !== "contato" && c.tipo !== "lista"; }).forEach(function (c) {
      if (c.tipo === "produto") {
        l.push("{{" + c.id + ".nome}}", "{{" + c.id + ".preco|brl}}");
        ((c.personalizado && c.personalizado.atributos) || []).forEach(function (a) { l.push("{{" + c.id + "." + a.id + "}}"); });
      } else l.push("{{" + c.id + "}}");
    });
    return l.concat(["{{calc.totalMensal|brl}}", "{{calc.totalUnico|brl}}", "{{calc.subtotal|brl}}"]);
  }

  function campoTexto(rotulo, valor, onInput, extra) {
    return h("div", { class: "campo" }, [h("label", { texto: rotulo }),
      h("input", Object.assign({ valor: valor, oninput: function (e) { onInput(e.target.value); } }, extra && extra.input || {})),
      extra && extra.ajuda ? h("div", { class: "ajuda", texto: extra.ajuda }) : null]);
  }

  function aparencia(s) {
    function set(k) {
      return function (v) {
        var n = Object.assign({}, atual());
        if (v) n[k] = v; else delete n[k];
        setAtual(n);
      };
    }
    return [
      campoTexto("Nome no menu de capítulos", s.capitulo || "", set("capitulo"), { ajuda: "Também é o nome que aparece no tempo de leitura por seção." }),
      campoTexto("Número decorativo", s.numero || "", set("numero"), { input: { placeholder: "01" } }),
      h("div", { class: "campo" }, [h("label", { texto: "Fundo" }), select(CAT.fundos, s.fundo || "padrao", set("fundo"))]),
      h("div", { class: "campo" }, [h("label", { texto: "Efeito ao rolar" }), select(CAT.efeitos, s.efeito || "padrao", set("efeito")),
        h("div", { class: "ajuda", texto: "Veja o efeito na aba Prévia ou no link do cliente." })]),
      campoTexto("Mostrar só se (avançado)", s.mostrarSe || "", set("mostrarSe"), {
        input: { placeholder: "ex.: observacoes" },
        ajuda: "Nome de um campo: a seção só aparece se ele estiver preenchido. Use ! para o contrário.",
      }),
    ];
  }

  function desenharProps() {
    if (!elProps) return;
    elProps.innerHTML = "";
    var s = atual();
    if (s) {
      var def = BLOCO[s.tipo];
      var fieldset = h("fieldset", { disabled: !podeEditar, style: "border:0;padding:0;margin:0" },
        abaProp === "conteudo"
          ? [camposBloco(def ? def.campos : [], atual, setAtual, function () { return m.campos; })]
          : aparencia(s));
      elProps.appendChild(h("div", { class: "card" }, [
        h("h2", { texto: def ? def.nome : "" }),
        h("div", { class: "abas", style: "margin-bottom:14px" }, [
          h("button", { type: "button", class: abaProp === "conteudo" ? "on" : "", texto: "Conteúdo",
            onclick: function () { abaProp = "conteudo"; desenharProps(); } }),
          h("button", { type: "button", class: abaProp === "aparencia" ? "on" : "", texto: "Aparência",
            onclick: function () { abaProp = "aparencia"; desenharProps(); } }),
        ]),
        fieldset,
      ]));
    } else {
      elProps.appendChild(h("div", { class: "card vazio", texto: "Clique numa seção para editar." }));
    }
    elProps.appendChild(h("div", { class: "card" }, [
      h("h2", { texto: "Variáveis" }),
      h("p", { class: "muted", style: "margin-top:-8px;font-size:12.5px", texto: "Clique para copiar e cole nos textos. Viram os dados da proposta." }),
      h("div", { class: "ed-vars" }, variaveis().map(function (v) {
        return h("button", { type: "button", class: "chip mono", texto: v,
          onclick: function () { if (navigator.clipboard) navigator.clipboard.writeText(v).catch(function () {}); } });
      })),
    ]));
  }

  // ------------------------------------------------- CamposBloco (formulário genérico)
  // ler() devolve o objeto atual; escrever(novo) grava a cópia alterada; camposForm() os campos do formulário.
  function camposBloco(campos, ler, escrever, camposForm) {
    return h("div", { class: "ed-campos" }, campos.map(function (c) {
      return umCampo(c, function () { return lerCaminho(ler(), c.k); },
        function (v) { escrever(escreverCaminho(ler(), c.k, v)); }, camposForm);
    }));
  }

  function umCampo(c, valor, onChange, camposForm) {
    var rotulo = h("label", { texto: c.rotulo });
    var ajuda = c.ajuda ? h("div", { class: "ajuda", texto: c.ajuda }) : null;
    var v = valor();
    switch (c.tipo) {
      case "texto":
        return h("div", { class: "campo" }, [rotulo, h("input", { valor: v == null ? "" : v, oninput: function (e) { onChange(e.target.value); } }), ajuda]);
      case "textoLongo":
        return h("div", { class: "campo" }, [rotulo, h("textarea", { rows: "3", valor: v == null ? "" : v, oninput: function (e) { onChange(e.target.value); } }), ajuda]);
      case "paragrafos":
        return h("div", { class: "campo" }, [rotulo,
          h("textarea", { rows: "6", valor: (v || []).join("\n\n"), oninput: function (e) { onChange(e.target.value.split(/\n\s*\n/)); } }),
          h("div", { class: "ajuda", texto: "Deixe uma linha em branco entre parágrafos. **negrito** e {{variáveis}} funcionam." })]);
      case "listaTexto":
        return h("div", { class: "campo" }, [rotulo,
          h("textarea", { rows: "4", valor: (v || []).join("\n"), oninput: function (e) { onChange(e.target.value.split("\n")); } }),
          h("div", { class: "ajuda", texto: "Um item por linha." })]);
      case "numero":
        return h("div", { class: "campo" }, [rotulo, h("input", { type: "number", valor: v == null ? "" : String(v),
          oninput: function (e) { onChange(e.target.value === "" ? 0 : Number(e.target.value)); } }), ajuda]);
      case "bool":
        return h("div", { class: "campo" }, [h("label", { style: "display:flex;gap:8px;align-items:center" }, [
          h("input", { type: "checkbox", marcado: !!v, style: "width:18px;height:18px", onchange: function (e) { onChange(e.target.checked); } }),
          " ", c.rotulo])]);
      case "select":
        return h("div", { class: "campo" }, [rotulo, select(c.opcoes, v == null ? "" : v, function (x) { onChange(x || undefined); }), ajuda]);
      case "campoForm":
        return h("div", { class: "campo" }, [rotulo, select([{ v: "", r: "Nenhum" }].concat(
          camposForm().filter(function (f) { return c.tiposCampo.indexOf(f.tipo) >= 0; }).map(function (f) { return { v: f.id, r: f.rotulo }; })),
        v == null ? "" : v, function (x) { onChange(x || undefined); }), ajuda]);
      case "icone":
        return h("div", { class: "campo" }, [rotulo, seletorIcone(v || "check", onChange)]);
      case "imagem":
        return h("div", { class: "campo" }, [rotulo, campoImagem(v || "", onChange)]);
      case "tabela":
        return h("div", { class: "campo" }, [rotulo, editorTabela(valor, onChange)]);
      case "lista":
        return listaItens(c, valor, onChange, camposForm);
    }
    return null;
  }

  function listaItens(c, valor, onChange, camposForm) {
    var aberto = null;
    // Itens podem vir como texto simples (ex.: checks antigos): normaliza para objeto
    function itens() {
      return (valor() || []).map(function (v) { return typeof v === "string" ? { titulo: v } : v; });
    }
    var cont = h("div", { class: "campo" });
    function tituloDe(it, i) { return String((c.titulo && it[c.titulo]) || "Item " + (i + 1)).slice(0, 48); }
    function desenhar() {
      var l = itens();
      cont.innerHTML = "";
      cont.appendChild(h("label", {}, [c.rotulo, " ", h("span", { class: "muted", texto: "(" + l.length + ")" })]));
      var lista = h("div", { class: "ed-lista" });
      l.forEach(function (it, i) {
        function mover(d) {
          var j = i + d;
          var x = itens();
          if (j < 0 || j >= x.length) return;
          var t = x[i];
          x[i] = x[j];
          x[j] = t;
          onChange(x);
          aberto = j;
          desenhar();
        }
        var titulo = h("span", { texto: tituloDe(it, i) });
        var item = h("div", { class: "ed-item " + (aberto === i ? "aberto" : "") }, [
          h("div", { class: "ed-item-topo", onclick: function () { aberto = aberto === i ? null : i; desenhar(); } }, [
            titulo,
            h("span", { class: "ed-item-acoes", onclick: function (e) { e.stopPropagation(); } }, [
              botaoAcao("Subir", "↑", function () { mover(-1); }),
              botaoAcao("Descer", "↓", function () { mover(1); }),
              botaoAcao("Duplicar", "⧉", function () {
                var x = itens();
                onChange(x.slice(0, i + 1).concat([clone(x[i])], x.slice(i + 1)));
                desenhar();
              }),
              botaoAcao("Remover", "×", function () {
                onChange(itens().filter(function (_, j) { return j !== i; }));
                desenhar();
              }),
            ]),
          ]),
        ]);
        if (aberto === i) {
          item.appendChild(h("div", { class: "ed-item-corpo", oninput: function () { titulo.textContent = tituloDe(itens()[i] || {}, i); } }, [
            camposBloco(c.itens, function () { return itens()[i]; }, function (v) {
              onChange(itens().map(function (x, j) { return j === i ? v : x; }));
            }, camposForm),
          ]));
        }
        lista.appendChild(item);
      });
      cont.appendChild(lista);
      cont.appendChild(h("button", { type: "button", class: "btn claro pequeno", texto: "+ Adicionar", onclick: function () {
        var x = itens();
        onChange(x.concat([clone(c.novo)]));
        aberto = x.length;
        desenhar();
      } }));
    }
    desenhar();
    return cont;
  }

  function seletorIcone(valor, onChange) {
    var aberto = false;
    var cont = h("div", { style: "position:relative" });
    function desenhar() {
      cont.innerHTML = "";
      cont.appendChild(h("button", { type: "button", class: "btn claro pequeno", style: "gap:8px",
        onclick: function () { aberto = !aberto; desenhar(); } }, [svg(valor, true), " ", valor]));
      if (aberto) {
        cont.appendChild(h("div", { class: "ed-icones" }, CAT.nomesIcones.map(function (n) {
          return h("button", { type: "button", title: n, class: n === valor ? "on" : "",
            onclick: function () { valor = n; onChange(n); aberto = false; desenhar(); } }, [svg(n, false)]);
        })));
      }
    }
    desenhar();
    return cont;
  }

  function campoImagem(valor, onChange) {
    var cont = h("div");
    var mini = h("img", { src: valor || null, alt: "", class: "ed-miniatura" });
    var enviando = false;
    var erroEl = h("div", { class: "alerta erro" });
    var arquivo = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", hidden: true,
      onchange: function () { if (arquivo.files && arquivo.files[0]) enviar(arquivo.files[0]); } });
    var botao = h("button", { type: "button", class: "btn claro pequeno", texto: "Enviar", onclick: function () { arquivo.click(); } });
    var url = h("input", { valor: valor, placeholder: "Envie um arquivo ou cole um link https://",
      oninput: function () { definir(url.value); } });
    function definir(v) {
      valor = v;
      onChange(v);
      if (v) { mini.src = v; if (!mini.parentNode) cont.insertBefore(mini, cont.firstChild); } else mini.remove();
    }
    function erro(t) {
      if (t) { erroEl.textContent = t; cont.appendChild(erroEl); } else erroEl.remove();
    }
    function enviar(f) {
      erro("");
      if (f.size > 5 * 1024 * 1024) return erro("Imagem maior que 5 MB.");
      enviando = true;
      botao.textContent = "Enviando...";
      botao.disabled = true;
      var fd = new FormData();
      fd.append("arquivo", f);
      fetch("/api/uploads", { method: "POST", body: fd, credentials: "same-origin", headers: { "X-CSRFToken": csrf() } })
        .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, j: j }; }); },
              function () { return { ok: false, j: null }; })
        .then(function (r) {
          enviando = false;
          botao.textContent = "Enviar";
          botao.disabled = false;
          arquivo.value = "";
          if (!r.ok) return erro((r.j && r.j.erro) || "Falha no envio.");
          url.value = r.j.url;
          definir(r.j.url);
        });
    }
    if (valor) cont.appendChild(mini);
    cont.appendChild(h("div", { style: "display:flex;gap:6px" }, [url, botao]));
    cont.appendChild(arquivo);
    cont.appendChild(h("div", { class: "ajuda", texto: "PNG, JPG, WebP ou GIF até 5 MB." }));
    return cont;
  }

  function editorTabela(valor, onChange) {
    var cont = h("div", { class: "ed-tabela" });
    function t() {
      var v = valor() || {};
      return { colunas: v.colunas || ["Coluna 1"], linhas: v.linhas || [[""]] };
    }
    function set(colunas, linhas, redesenhar) {
      onChange({ colunas: colunas, linhas: linhas });
      if (redesenhar) desenhar();
    }
    function desenhar() {
      var x = t();
      cont.innerHTML = "";
      cont.appendChild(h("table", {}, [
        h("thead", {}, [h("tr", {}, x.colunas.map(function (c, j) {
          return h("th", {}, [
            h("input", { valor: c, oninput: function (e) {
              var y = t();
              set(y.colunas.map(function (z, k) { return k === j ? e.target.value : z; }), y.linhas);
            } }),
            h("button", { type: "button", title: "Remover coluna", texto: "×", onclick: function () {
              var y = t();
              set(y.colunas.filter(function (_, k) { return k !== j; }),
                y.linhas.map(function (l) { return l.filter(function (_, k) { return k !== j; }); }), true);
            } }),
          ]);
        }))]),
        h("tbody", {}, x.linhas.map(function (l, i) {
          return h("tr", {}, x.colunas.map(function (_, j) {
            return h("td", {}, [h("textarea", { rows: "1", valor: l[j] == null ? "" : l[j], oninput: function (e) {
              var y = t();
              set(y.colunas, y.linhas.map(function (z, k) {
                return k === i ? y.colunas.map(function (__, mm) { return mm === j ? e.target.value : (z[mm] == null ? "" : z[mm]); }) : z;
              }));
            } })]);
          }).concat([h("td", { class: "ed-tab-acao" }, [h("button", { type: "button", title: "Remover linha", texto: "×", onclick: function () {
            var y = t();
            set(y.colunas, y.linhas.filter(function (_, k) { return k !== i; }), true);
          } })])]));
        })),
      ]));
      cont.appendChild(h("div", { style: "display:flex;gap:6px;margin-top:6px" }, [
        h("button", { type: "button", class: "btn claro pequeno", texto: "+ Linha", onclick: function () {
          var y = t();
          set(y.colunas, y.linhas.concat([y.colunas.map(function () { return ""; })]), true);
        } }),
        h("button", { type: "button", class: "btn claro pequeno", texto: "+ Coluna", onclick: function () {
          var y = t();
          set(y.colunas.concat(["Coluna " + (y.colunas.length + 1)]), y.linhas.map(function (l) { return l.concat([""]); }), true);
        } }),
      ]));
    }
    desenhar();
    return cont;
  }

  // ------------------------------------------------- aba Formulário (EditorCampos)
  var COMUNS = [
    { k: "rotulo", rotulo: "Rótulo", tipo: "texto" },
    { k: "id", rotulo: "Variável (usada nos textos como {{variavel}})", tipo: "texto", ajuda: "Letras e números, sem espaços. Ex.: dispositivos" },
    { k: "obrigatorio", rotulo: "Obrigatório", tipo: "bool" },
    { k: "largura", rotulo: "Largura", tipo: "select", opcoes: [{ v: "inteira", r: "Linha inteira" }, { v: "meia", r: "Meia linha (lado a lado)" }] },
    { k: "ajuda", rotulo: "Texto de ajuda", tipo: "texto" },
  ];
  var POR_TIPO = {
    texto: [{ k: "padrao", rotulo: "Valor inicial", tipo: "texto" }, { k: "placeholder", rotulo: "Exemplo no campo vazio", tipo: "texto" }],
    textoLongo: [{ k: "padrao", rotulo: "Valor inicial", tipo: "textoLongo" }],
    numero: [{ k: "padrao", rotulo: "Valor inicial", tipo: "numero" }, { k: "min", rotulo: "Mínimo", tipo: "numero" }, { k: "max", rotulo: "Máximo", tipo: "numero" }],
    moeda: [{ k: "padrao", rotulo: "Valor inicial (R$)", tipo: "numero" }],
    data: [{ k: "padraoDias", rotulo: "Padrão: hoje + quantos dias", tipo: "numero" }],
    checkbox: [{ k: "padrao", rotulo: "Marcado por padrão", tipo: "bool" }],
    selecao: [{ k: "opcoes", rotulo: "Opções", tipo: "lista", titulo: "rotulo", novo: { valor: "opcao", rotulo: "Opção" },
      itens: [{ k: "rotulo", rotulo: "Texto", tipo: "texto" }, { k: "valor", rotulo: "Valor", tipo: "texto" }] }],
    produto: [
      { k: "categoria", rotulo: "Categoria do catálogo", tipo: "texto", ajuda: "Itens cadastrados em Produtos e planos com esta categoria" },
      { k: "padrao", rotulo: "Código do item escolhido por padrão", tipo: "texto" },
      { k: "personalizado.rotulo", rotulo: "Opção personalizada (deixe vazio para não oferecer)", tipo: "texto" },
      { k: "personalizado.atributos", rotulo: "Atributos editáveis no personalizado", tipo: "lista", titulo: "rotulo", novo: { id: "atributo", rotulo: "Atributo" },
        itens: [{ k: "rotulo", rotulo: "Rótulo", tipo: "texto" }, { k: "id", rotulo: "Atributo do produto", tipo: "texto" }] },
      { k: "personalizado.nota", rotulo: "Nota do personalizado", tipo: "textoLongo" },
    ],
    desconto: [{ k: "limitePct", rotulo: "Alerta acima de (%)", tipo: "numero" }],
    lista: [{ k: "max", rotulo: "Máximo de itens", tipo: "numero" }, { k: "rotuloTitulo", rotulo: "Exemplo do título", tipo: "texto" }, { k: "rotuloDescricao", rotulo: "Exemplo da descrição", tipo: "texto" }],
  };

  function editorCampos() {
    var selC = m.campos.length ? 0 : null;
    var novoTipo = "texto";
    var cardLista = h("div", { class: "card" });
    var cardEdicao = h("div", { class: "card" });
    var listaEl = h("div", { class: "ed-lista" });
    function setCampos(c) { m.campos = c; mudou(); }
    function mover(i, d) {
      var j = i + d;
      if (j < 0 || j >= m.campos.length) return;
      var l = m.campos.slice();
      var t = l[i];
      l[i] = l[j];
      l[j] = t;
      setCampos(l);
      selC = j;
      desenharLista();
      desenharEdicao();
    }
    function desenharLista() {
      listaEl.innerHTML = "";
      m.campos.forEach(function (c, i) {
        listaEl.appendChild(h("div", { class: "ed-item " + (selC === i ? "aberto" : "") }, [
          h("div", { class: "ed-item-topo", onclick: function () { selC = i; desenharLista(); desenharEdicao(); } }, [
            h("span", {}, [h("b", { texto: c.rotulo }), " ", h("span", { class: "muted" }, ["· ", NOME_TIPO[c.tipo], " · ", h("span", { class: "mono", texto: "{{" + c.id + "}}" })])]),
            h("span", { class: "ed-item-acoes", onclick: function (e) { e.stopPropagation(); } }, [
              h("button", { type: "button", texto: "↑", onclick: function () { mover(i, -1); } }),
              h("button", { type: "button", texto: "↓", onclick: function () { mover(i, 1); } }),
              h("button", { type: "button", texto: "×", onclick: function () {
                setCampos(m.campos.filter(function (_, j) { return j !== i; }));
                selC = null;
                desenharLista();
                desenharEdicao();
              } }),
            ]),
          ]),
        ]));
      });
    }
    var tituloEl;
    function desenharTitulo() {
      var c = m.campos[selC];
      tituloEl.innerHTML = "";
      tituloEl.appendChild(document.createTextNode(c.rotulo == null ? "" : c.rotulo));
      tituloEl.appendChild(document.createTextNode(" "));
      tituloEl.appendChild(h("span", { class: "chip", texto: NOME_TIPO[c.tipo] }));
    }
    function desenharEdicao() {
      cardEdicao.innerHTML = "";
      var c = selC !== null ? m.campos[selC] : null;
      if (!c) return cardEdicao.appendChild(h("div", { class: "vazio", texto: "Selecione um campo para editar." }));
      tituloEl = h("h2");
      desenharTitulo();
      var i = selC;
      cardEdicao.appendChild(tituloEl);
      cardEdicao.appendChild(camposBloco(COMUNS.concat(POR_TIPO[c.tipo] || []), function () { return m.campos[i]; }, function (v) {
        setCampos(m.campos.map(function (x, j) { return j === i ? v : x; }));
        desenharLista();
        desenharTitulo();
      }, function () { return m.campos; }));
    }
    var tipoSel = h("select", { style: "height:36px;border-radius:9px;border:1.5px solid var(--line);padding:0 8px",
      onchange: function () { novoTipo = tipoSel.value; } },
      CAT.tiposCampo.map(function (t) { return h("option", { value: t.tipo, texto: t.nome }); }));
    tipoSel.value = novoTipo;
    function adicionar() {
      var id = novoTipo === "contato" ? "cliente" : novoTipo;
      for (var n = 2; m.campos.some(function (c) { return c.id === id; }); n++) id = novoTipo + n;
      var extra = {
        selecao: { opcoes: [{ valor: "a", rotulo: "Opção A" }, { valor: "b", rotulo: "Opção B" }] },
        produto: { categoria: "planos" }, data: { padraoDias: 15 }, desconto: { limitePct: 15 }, lista: { max: 8 },
      };
      setCampos(m.campos.concat([Object.assign({ id: id, tipo: novoTipo, rotulo: NOME_TIPO[novoTipo] }, extra[novoTipo] || {})]));
      selC = m.campos.length - 1;
      desenharLista();
      desenharEdicao();
    }
    cardLista.appendChild(h("h2", { texto: "Campos do formulário" }));
    cardLista.appendChild(h("p", { class: "muted", style: "margin-top:-8px", texto: "O que o vendedor preenche ao criar a proposta. Cada campo vira uma variável para os textos." }));
    cardLista.appendChild(listaEl);
    cardLista.appendChild(h("div", { style: "display:flex;gap:8px;margin-top:10px" }, [
      tipoSel, h("button", { type: "button", class: "btn pequeno", texto: "+ Adicionar campo", onclick: adicionar }),
    ]));
    desenharLista();
    desenharEdicao();
    return h("div", { class: "ed-form" }, [cardLista, cardEdicao]);
  }

  // ------------------------------------------------- aba Cálculo (EditorCalculo)
  function editorCalculo() {
    var cont = h("div", { class: "ed-form" });
    function prec() { return m.precificacao; }
    function onChange(p, redesenhar) {
      m.precificacao = p;
      mudou();
      if (redesenhar) desenhar();
    }
    function de(tipos) { return m.campos.filter(function (c) { return tipos.indexOf(c.tipo) >= 0; }); }
    function sel(valor, opcoes, set, vazio) {
      return select([{ v: "", r: vazio || "Nenhum" }].concat(opcoes.map(function (c) { return { v: c.id, r: c.rotulo }; })),
        valor == null ? "" : valor, set);
    }
    function adicionais() { return (prec().recorrente && prec().recorrente.adicionais) || []; }
    function setRec(r, redesenhar) {
      var p = Object.assign({}, prec());
      if (r === undefined) delete p.recorrente; else p.recorrente = r;
      onChange(p, redesenhar);
    }
    function setAd(l, redesenhar) {
      setRec(Object.assign({}, prec().recorrente, { base: (prec().recorrente && prec().recorrente.base) || { campo: "" }, adicionais: l }), redesenhar);
    }
    function campo(rotulo, filhos) { return h("div", { class: "campo" }, [h("label", { texto: rotulo })].concat(filhos)); }
    function numero(valor, set, attrs) {
      return h("input", Object.assign({ type: "number", valor: valor == null ? "" : String(valor),
        oninput: function (e) { set(e.target.value); } }, attrs || {}));
    }
    function texto(valor, set) {
      return h("input", { valor: valor == null ? "" : valor, oninput: function (e) { set(e.target.value); } });
    }

    function desenhar() {
      cont.innerHTML = "";
      var p = prec();
      var rec = p.recorrente;
      var card1 = h("div", { class: "card" }, [
        h("h2", { texto: "Mensalidade" }),
        campo("Valor base vem do campo", [
          sel(rec && rec.base.campo, de(["produto", "moeda"]), function (v) {
            // Diferente do Next, preserva recorrente.extras ao trocar o campo base
            setRec(v ? Object.assign({}, prec().recorrente, { base: { campo: v }, adicionais: adicionais() }) : undefined, true);
          }, "Sem mensalidade"),
          h("div", { class: "ajuda", texto: "Um campo “Produto/Plano” (usa o preço do catálogo) ou “Valor (R$)”." }),
        ]),
        h("h2", { style: "margin-top:18px", texto: "Adicionais por quantidade" }),
      ]);
      adicionais().forEach(function (a, i) {
        function up(patch, redesenhar) {
          setAd(adicionais().map(function (x, j) { return j === i ? Object.assign({}, x, patch) : x; }), redesenhar);
        }
        function cur() { return adicionais()[i]; }
        card1.appendChild(h("div", { class: "caixa-destaque" }, [
          h("div", { class: "linha2" }, [
            campo("Quantidade vem do campo", [sel(a.campo, de(["numero"]), function (v) { up({ campo: v }, true); })]),
            campo("Inclusos", [numero(a.inclusos, function (v) { up({ inclusos: Number(v) }); })]),
          ]),
          h("div", { class: "linha2" }, [
            campo("Valor por adicional (R$)", [numero(a.valorUnitario, function (v) { up({ valorUnitario: Number(v) }); }, { step: "0.01" })]),
            campo("Linha na proposta", [texto(a.rotuloLinha, function (v) { up({ rotuloLinha: v }); })]),
          ]),
          h("div", { class: "linha2" }, [
            campo("Unidade (singular / plural)", [h("div", { style: "display:flex;gap:6px" }, [
              texto(a.unidade[0], function (v) { up({ unidade: [v, cur().unidade[1]] }); }),
              texto(a.unidade[1], function (v) { up({ unidade: [cur().unidade[0], v] }); }),
            ])]),
            campo("No resumo (singular / plural)", [h("div", { style: "display:flex;gap:6px" }, [
              texto(a.rotuloSingular, function (v) { up({ rotuloSingular: v }); }),
              texto(a.rotuloPlural, function (v) { up({ rotuloPlural: v }); }),
            ])]),
          ]),
          h("button", { type: "button", class: "btn claro pequeno", texto: "Remover adicional", onclick: function () {
            setAd(adicionais().filter(function (_, j) { return j !== i; }), true);
          } }),
        ]));
      });
      card1.appendChild(h("button", { type: "button", class: "btn claro pequeno", disabled: !rec, texto: "+ Adicional por quantidade", onclick: function () {
        setAd(adicionais().concat([{ campo: "", inclusos: 0, valorUnitario: 0, rotuloLinha: "Quantidade", unidade: ["item", "itens"],
          rotuloSingular: "item adicional", rotuloPlural: "itens adicionais" }]), true);
      } }));

      var unicos = p.unicos || [];
      function setUnicos(l, redesenhar) { onChange(Object.assign({}, prec(), { unicos: l }), redesenhar); }
      var card2 = h("div", { class: "card" }, [
        h("h2", { texto: "Desconto" }),
        h("div", { class: "linha2" }, [
          campo("Campo de desconto", [sel(p.desconto && p.desconto.campo, de(["desconto"]), function (v) {
            var n = Object.assign({}, prec());
            if (v) n.desconto = { campo: v, limitePct: prec().desconto ? prec().desconto.limitePct : undefined }; else delete n.desconto;
            onChange(n, true);
          })]),
          campo("Alerta acima de (%)", [numero(p.desconto ? p.desconto.limitePct : "", function (v) {
            if (!prec().desconto) return;
            onChange(Object.assign({}, prec(), { desconto: Object.assign({}, prec().desconto, { limitePct: v === "" ? undefined : Number(v) }) }));
          }, { disabled: !p.desconto })]),
        ]),
        h("h2", { style: "margin-top:18px", texto: "Valores únicos" }),
        h("p", { class: "muted", style: "margin-top:-8px", texto: "Cobrados uma vez (implantação, setup...)." }),
      ]);
      unicos.forEach(function (u, i) {
        function mapa(patch) { return (prec().unicos || []).map(function (x, j) { return j === i ? Object.assign({}, x, patch) : x; }); }
        card2.appendChild(h("div", { class: "linha2", style: "align-items:end" }, [
          campo("Campo (R$)", [sel(u.campo, de(["moeda"]), function (v) { setUnicos(mapa({ campo: v }), true); })]),
          campo("Rótulo", [h("div", { style: "display:flex;gap:6px" }, [
            texto(u.rotulo, function (v) { setUnicos(mapa({ rotulo: v })); }),
            h("button", { type: "button", class: "btn claro pequeno", style: "height:40px", texto: "×", onclick: function () {
              setUnicos((prec().unicos || []).filter(function (_, j) { return j !== i; }), true);
            } }),
          ])]),
        ]));
      });
      card2.appendChild(h("button", { type: "button", class: "btn claro pequeno", texto: "+ Valor único", onclick: function () {
        setUnicos((prec().unicos || []).concat([{ campo: "", rotulo: "Implantação (única)" }]), true);
      } }));
      cont.appendChild(card1);
      cont.appendChild(card2);
    }
    desenhar();
    return cont;
  }

  // ------------------------------------------------------------- início
  desenharTopo();
  desenharCorpo();
  renderizarBlocos();
})();
