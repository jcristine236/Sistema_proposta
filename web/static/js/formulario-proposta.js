// Tela "Nova/Editar proposta" (antes FormularioProposta.tsx + CamposFormulario.tsx).
// O estado (dados) vive aqui; o resumo financeiro e a prévia vêm do servidor
// (/admin/propostas/calculo e /previa), com as mesmas regras da página pública.
(function () {
  "use strict";

  var cfgEl = document.getElementById("config-formulario");
  var area = document.querySelector("[data-form-proposta]");
  if (!cfgEl || !area) return;
  var cfg = JSON.parse(cfgEl.textContent);
  var campos = cfg.campos, catalogo = cfg.catalogo, contatos = cfg.contatos;
  var dados = cfg.dados;
  var descontoPct = 0;
  var card = area.querySelector(".card");
  var botaoGerar = area.querySelector("[data-gerar]");
  var textoBotao = botaoGerar.textContent;

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
  function brl(v) {
    return (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function num(x) { return x === "" ? 0 : Number(x); }
  function csrf() {
    var m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function postar(url, corpo) {
    return fetch(url, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
      body: JSON.stringify(corpo),
    }).then(function (r) { return r.json().catch(function () { return {}; }); }, function () { return {}; });
  }

  // ------------------------------------------------- estado + recálculo
  var gerada = null;
  var timerCalc = null;
  function alterar(id, valor, redesenhar) {
    dados[id] = valor;
    gerada = null;
    desenharLink();
    if (redesenhar) desenharCampos();
    clearTimeout(timerCalc);
    timerCalc = setTimeout(recalcular, 250);
  }
  function recalcular() {
    postar(cfg.urlCalculo, { chave: cfg.chave, dados: dados }).then(function (j) {
      if (j.resumo !== undefined) area.querySelector("[data-resumo]").innerHTML = j.resumo; // HTML do nosso servidor
      if (typeof j.pct === "number" && j.pct !== descontoPct) {
        descontoPct = j.pct;
        desenharCampos();
      }
    });
  }

  // ------------------------------------------------------------- campos
  function rotulo(c, id) {
    return h("label", { for: id }, [c.rotulo + (c.obrigatorio ? " *" : "")]);
  }
  function ajuda(c) { return c.ajuda ? h("div", { class: "ajuda", texto: c.ajuda }) : null; }

  function umCampo(c) {
    var v = dados[c.id];
    var id = "f-" + c.id;
    switch (c.tipo) {
      case "contato": {
        var val = v || { nome: "" };
        var dica = h("div", { class: "ajuda" });
        var atualizarDica = function (x) {
          dica.textContent = x.contatoId ? "Cliente já cadastrado." : x.nome.trim() ? "Novo cliente: será cadastrado ao gerar a proposta." : "";
        };
        atualizarDica(val);
        var lista = h("datalist", { id: id + "-lista" }, contatos.map(function (x) { return h("option", { value: x.organizacao }); }));
        return [h("div", { class: "campo" }, [
          rotulo(c, id),
          h("input", { id: id, list: id + "-lista", valor: val.nome, placeholder: "Digite ou escolha um cliente cadastrado",
            oninput: function (e) {
              var nome = e.target.value;
              var ex = contatos.find(function (x) { return x.organizacao.toLowerCase() === nome.trim().toLowerCase(); });
              var novo = { nome: nome, contatoId: ex ? ex.id : undefined };
              atualizarDica(novo);
              alterar(c.id, novo);
            } }),
          lista, dica,
        ])];
      }
      case "texto":
        return [h("div", { class: "campo" }, [rotulo(c, id),
          h("input", { id: id, valor: v == null ? "" : v, maxlength: c.maxLength, placeholder: c.placeholder,
            oninput: function (e) { alterar(c.id, e.target.value); } }), ajuda(c)])];
      case "textoLongo":
        return [h("div", { class: "campo" }, [rotulo(c, id),
          h("textarea", { id: id, valor: v == null ? "" : v, placeholder: c.placeholder,
            oninput: function (e) { alterar(c.id, e.target.value); } }), ajuda(c)])];
      case "numero":
        return [h("div", { class: "campo" }, [rotulo(c, id),
          h("input", { id: id, type: "number", min: c.min, max: c.max, step: c.passo == null ? 1 : c.passo, valor: String(v == null ? "" : v),
            oninput: function (e) { alterar(c.id, num(e.target.value)); } }), ajuda(c)])];
      case "moeda":
        return [h("div", { class: "campo" }, [rotulo(c, id),
          h("input", { id: id, type: "number", min: 0, step: c.passo == null ? 0.01 : c.passo, valor: String(v == null ? "" : v),
            oninput: function (e) { alterar(c.id, num(e.target.value)); } }), ajuda(c)])];
      case "data":
        return [h("div", { class: "campo" }, [rotulo(c, id),
          h("input", { id: id, type: "date", valor: v == null ? "" : v, oninput: function (e) { alterar(c.id, e.target.value); } }), ajuda(c)])];
      case "selecao": {
        var sel = h("select", { id: id, onchange: function (e) { alterar(c.id, e.target.value); } },
          (c.opcoes || []).map(function (o) { return h("option", { value: o.valor, texto: o.rotulo }); }));
        sel.value = v == null ? "" : v;
        return [h("div", { class: "campo" }, [rotulo(c, id), sel, ajuda(c)])];
      }
      case "checkbox":
        return [h("div", { class: "campo" }, [
          h("label", { style: "display:flex;gap:8px;align-items:center;font-weight:600" }, [
            h("input", { type: "checkbox", marcado: !!v, style: "width:18px;height:18px", onchange: function (e) { alterar(c.id, e.target.checked); } }),
            c.rotulo,
          ]), ajuda(c)])];
      case "produto": return campoProduto(c, v, id);
      case "desconto": return campoDesconto(c, v, id);
      case "lista": return campoLista(c, v);
      case "adicionais": return campoAdicionais(c, v);
    }
    return [];
  }

  function campoProduto(c, v, id) {
    var val = v || { codigo: "" };
    var itens = catalogo.filter(function (p) { return p.categoria === c.categoria; });
    var pers = c.personalizado || null;
    var escolher = function (codigo) {
      if (codigo === "personalizado") {
        // Começa com os valores do plano escolhido antes
        var base = itens.find(function (p) { return p.codigo === val.codigo; }) || itens[0];
        var atributos = {};
        ((pers && pers.atributos) || []).forEach(function (a) { atributos[a.id] = Number((base && base.atributos[a.id]) || 0); });
        alterar(c.id, { codigo: codigo, personalizado: { nome: "Personalizado", preco: base ? base.preco : 0, atributos: atributos } }, true);
      } else alterar(c.id, Object.assign({}, val, { codigo: codigo }), true);
    };
    var opcoes = [h("option", { value: "", disabled: true, texto: "Selecione" })].concat(itens.map(function (x) {
      return h("option", { value: x.codigo, texto: x.nome + (x.descricao ? ": " + x.descricao : "") + " · " + brl(x.preco) });
    }));
    if (pers && pers.rotulo) opcoes.push(h("option", { value: "personalizado", texto: pers.rotulo }));
    var sel = h("select", { id: id, onchange: function (e) { escolher(e.target.value); } }, opcoes);
    sel.value = val.codigo;
    var saida = [h("div", { class: "campo" }, [
      rotulo(c, id), sel,
      itens.length === 0 ? h("div", { class: "ajuda", texto: "Nenhum item na categoria “" + c.categoria + "”. Cadastre em Produtos e planos." }) : null,
      ajuda(c),
    ])];
    var p = val.personalizado;
    if (val.codigo === "personalizado" && pers && pers.rotulo && p) {
      var setP = function (patch, redesenhar) {
        var novo = Object.assign({ nome: p.nome || "", preco: p.preco || 0, atributos: p.atributos || {} }, patch);
        val = Object.assign({}, val, { personalizado: novo });
        p = novo;
        alterar(c.id, val, redesenhar);
      };
      saida.push(h("div", { class: "caixa-destaque" }, [
        h("div", { class: "titulo", texto: "Plano personalizado" }),
        h("div", { class: "linha2" }, [
          h("div", { class: "campo" }, [h("label", { texto: "Nome do plano" }), h("input", { valor: p.nome, maxlength: 40, oninput: function (e) { setP({ nome: e.target.value }); } })]),
          h("div", { class: "campo" }, [h("label", { texto: "Mensalidade base (R$)" }), h("input", { type: "number", min: 0, valor: p.preco, oninput: function (e) { setP({ preco: num(e.target.value) }); } })]),
        ]),
        h("div", { class: "linha2" }, (pers.atributos || []).map(function (a) {
          return h("div", { class: "campo" }, [h("label", { texto: a.rotulo }), h("input", { type: "number", min: 1, valor: p.atributos[a.id] == null ? 0 : p.atributos[a.id],
            oninput: function (e) { var at = Object.assign({}, p.atributos); at[a.id] = num(e.target.value); setP({ atributos: at }); } })]);
        })),
        pers.nota ? h("div", { class: "ajuda", style: "margin-bottom:12px", texto: pers.nota }) : null,
      ]));
    }
    return saida;
  }

  function campoDesconto(c, v, id) {
    var val = v || { tipo: "nenhum", valor: 0 };
    var sel = h("select", { id: id, onchange: function (e) { alterar(c.id, Object.assign({}, val, { tipo: e.target.value }), true); } }, [
      h("option", { value: "nenhum", texto: "Sem desconto" }),
      h("option", { value: "pct", texto: "Percentual (%)" }),
      h("option", { value: "valor", texto: "Valor fixo (R$)" }),
    ]);
    sel.value = val.tipo;
    var saida = [h("div", { class: "linha2" }, [
      h("div", { class: "campo" }, [h("label", { for: id, texto: c.rotulo }), sel]),
      h("div", { class: "campo" }, [h("label", { texto: "Valor do desconto" }),
        h("input", { type: "number", min: 0, step: 0.5, disabled: val.tipo === "nenhum", valor: val.valor,
          oninput: function (e) { val = Object.assign({}, val, { valor: num(e.target.value) }); alterar(c.id, val); } })]),
    ])];
    if (c.limitePct !== undefined && c.limitePct !== null && descontoPct > c.limitePct) {
      saida.push(h("div", { class: "alerta aviso", texto: "Desconto acima de " + c.limitePct + "% da mensalidade. Confirme a aprovação antes de enviar." }));
    }
    return saida;
  }

  function campoLista(c, v) {
    var itens = v || [];
    var max = c.max == null ? 8 : c.max;
    var set = function (l, redesenhar) { alterar(c.id, l, redesenhar); };
    var linhas = itens.map(function (it, i) {
      return h("div", { class: "lista-item" }, [
        h("input", { placeholder: c.rotuloTitulo || "Título", maxlength: 60, valor: it.titulo,
          oninput: function (e) { itens = itens.map(function (x, j) { return j === i ? Object.assign({}, x, { titulo: e.target.value }) : x; }); set(itens); } }),
        h("input", { placeholder: c.rotuloDescricao || "Descrição", maxlength: 300, valor: it.descricao,
          oninput: function (e) { itens = itens.map(function (x, j) { return j === i ? Object.assign({}, x, { descricao: e.target.value }) : x; }); set(itens); } }),
        h("button", { type: "button", "aria-label": "Remover", texto: "×",
          onclick: function () { set(itens.filter(function (_, j) { return j !== i; }), true); } }),
      ]);
    });
    return [h("div", { class: "campo" }, [h("label", { texto: c.rotulo })].concat(linhas).concat([
      itens.length < max ? h("button", { type: "button", class: "btn claro pequeno", texto: "+ Adicionar campo",
        onclick: function () { set(itens.concat([{ titulo: "", descricao: "" }]), true); } }) : null,
      ajuda(c),
    ]))];
  }

  function campoAdicionais(c, v) {
    var itens = v || [];
    var max = c.max == null ? 20 : c.max;
    var comQtd = !!c.comQuantidade;
    var dica = h("div", { class: "ajuda" });
    var atualizarDica = function () {
      var total = itens.reduce(function (s, it) { return s + (num(String(it.valor)) || 0) * (comQtd && it.quantidade ? it.quantidade : 1); }, 0);
      dica.textContent = (itens.length > 0 ? "Soma dos adicionais: " + brl(total) + " / mês." : "") + " " + (c.ajuda || "");
    };
    var set = function (l, redesenhar) { itens = l; atualizarDica(); alterar(c.id, l, redesenhar); };
    var muda = function (i, patch) { return itens.map(function (x, j) { return j === i ? Object.assign({}, x, patch) : x; }); };
    var novo = function (nome) { var o = { nome: nome, valor: 0 }; if (comQtd) o.quantidade = 1; return o; };
    var filhos = [h("label", { texto: c.rotulo })];
    if (c.sugestoes && c.sugestoes.length) {
      filhos.push(h("div", { class: "sugestoes" }, c.sugestoes.filter(function (s) {
        return !itens.some(function (it) { return it.nome === s; });
      }).map(function (s) {
        return h("button", { type: "button", class: "chip", texto: "+ " + s,
          onclick: function () { if (itens.length < max) set(itens.concat([novo(s)]), true); } });
      })));
    }
    itens.forEach(function (it, i) {
      filhos.push(h("div", { class: "adicional-item" }, [
        h("input", { placeholder: "Adicional", maxlength: 80, valor: it.nome, oninput: function (e) { set(muda(i, { nome: e.target.value })); } }),
        comQtd ? h("input", { type: "number", min: 1, step: 1, placeholder: c.rotuloQuantidade || "Qtd", title: c.rotuloQuantidade || "Quantidade",
          valor: it.quantidade == null ? 1 : it.quantidade, style: "max-width:80px",
          oninput: function (e) { set(muda(i, { quantidade: Math.max(1, Math.floor(num(e.target.value))) })); } }) : null,
        h("input", { type: "number", min: 0, step: 0.01, placeholder: "Valor (R$)", valor: it.valor || "", style: "max-width:120px",
          oninput: function (e) { set(muda(i, { valor: num(e.target.value) })); } }),
        h("button", { type: "button", "aria-label": "Remover", texto: "×", onclick: function () { set(itens.filter(function (_, j) { return j !== i; }), true); } }),
      ]));
    });
    if (itens.length < max) {
      filhos.push(h("button", { type: "button", class: "btn claro pequeno", texto: "+ Adicionar adicional",
        onclick: function () { set(itens.concat([novo("")]), true); } }));
    }
    atualizarDica();
    filhos.push(dica);
    return [h("div", { class: "campo" }, filhos)];
  }

  var nosCampos = [];
  function desenharCampos() {
    nosCampos.forEach(function (n) { n.remove(); });
    nosCampos = [];
    // Agrupa campos "meia" largura em pares lado a lado
    var linhas = [];
    campos.forEach(function (c) {
      var ult = linhas[linhas.length - 1];
      if (c.largura === "meia" && ult && ult.length === 1 && ult[0].largura === "meia") ult.push(c);
      else linhas.push([c]);
    });
    var antes = card.querySelector(".alerta.erro") || botaoGerar;
    linhas.forEach(function (l) {
      var nos = l.length === 2
        ? [h("div", { class: "linha2" }, umCampo(l[0]).concat(umCampo(l[1])))]
        : umCampo(l[0]);
      nos.forEach(function (n) { card.insertBefore(n, antes); nosCampos.push(n); });
    });
  }

  // --------------------------------------------------- erros, gerar e link
  function mostrarErros(erros) {
    var atual = card.querySelector(".alerta.erro");
    if (atual) atual.remove();
    if (erros.length) {
      card.insertBefore(h("div", { class: "alerta erro" }, erros.map(function (e) { return h("div", { texto: e }); })), botaoGerar);
    }
  }
  function validar() {
    var erros = [];
    campos.forEach(function (c) {
      if (!c.obrigatorio) return;
      var v = dados[c.id];
      var vazio = v === undefined || v === null || v === "" ||
        (c.tipo === "contato" && !(v.nome || "").trim()) || (c.tipo === "produto" && !v.codigo);
      if (vazio) erros.push("Preencha o campo \"" + c.rotulo + "\".");
    });
    return erros;
  }
  function desenharLink() {
    var atual = card.querySelector(".link-box");
    if (atual) atual.remove();
    if (!gerada) return;
    var copiar = h("button", { class: "btn claro pequeno", type: "button", texto: "Copiar link", onclick: function () {
      Promise.resolve(navigator.clipboard && navigator.clipboard.writeText(gerada.link)).catch(function () {});
      copiar.textContent = "Copiado!";
      setTimeout(function () { copiar.textContent = "Copiar link"; }, 2000);
    } });
    card.appendChild(h("div", { class: "link-box" }, [
      h("strong", { texto: cfg.editar ? "Alterações salvas. O link continua o mesmo:" : "Proposta " + gerada.codigo + " criada. Link pronto para enviar:" }),
      h("code", { texto: gerada.link }),
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, [
        copiar,
        h("a", { class: "btn claro pequeno", href: gerada.link, target: "_blank", rel: "noreferrer", texto: "Abrir" }),
        h("a", { class: "btn claro pequeno", href: "/admin/propostas/" + gerada.id, texto: "Acompanhar" }),
      ]),
    ]));
  }
  botaoGerar.addEventListener("click", function () {
    var erros = validar();
    mostrarErros(erros);
    if (erros.length) return;
    botaoGerar.disabled = true;
    botaoGerar.textContent = "Salvando...";
    postar(cfg.urlSalvar, { dados: dados }).then(function (r) {
      botaoGerar.disabled = false;
      botaoGerar.textContent = textoBotao;
      if (r.erros) return mostrarErros(r.erros);
      if (r.erro) return mostrarErros([r.erro]);
      if (!r.id) return mostrarErros(["Não foi possível salvar. Tente novamente."]);
      gerada = r;
      desenharLink();
    });
  });

  // ----------------------------------------------------------- abas
  var abas = document.querySelector("[data-abas]");
  var btnForm = abas.querySelector("[data-aba-form]");
  var btnPrevia = abas.querySelector("[data-aba-previa]");
  var moldura = null, fimPrevia = null;
  function aba(qual) {
    btnForm.className = qual === "form" ? "on" : "";
    btnPrevia.className = qual === "previa" ? "on" : "";
    if (fimPrevia) { fimPrevia(); fimPrevia = null; }
    if (moldura) { moldura.remove(); moldura = null; }
    area.style.display = qual === "form" ? "" : "none";
    if (qual !== "previa") return;
    window.scrollTo({ top: 0 });
    moldura = h("div", { class: "previa-moldura" });
    area.parentNode.insertBefore(moldura, area);
    postar(cfg.urlPrevia, { chave: cfg.chave, dados: dados }).then(function (j) {
      if (!moldura || !j.html) return;
      moldura.innerHTML = j.html; // HTML renderizado pelo nosso servidor (textos escapados)
      var raiz = moldura.querySelector("[data-proposta]");
      if (raiz && window.iniciarProposta) fimPrevia = window.iniciarProposta(raiz);
    });
  }
  btnForm.addEventListener("click", function () { aba("form"); });
  btnPrevia.addEventListener("click", function () { aba("previa"); });

  desenharCampos();
  recalcular();
})();
