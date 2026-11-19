// Comportamento da proposta (antes no PropostaView.tsx/Secoes.tsx/Logo.tsx do Next):
// revelar ao rolar, contadores, progresso, capítulos, linha do tempo, barra de ações,
// abas de selos, logo proporcional e os modais de aceitar / recusar / comentar.
// JS puro, sem build e sem eval (compatível com a CSP com nonce).
(function () {
  "use strict";

  var raiz = document.querySelector("[data-proposta]");
  if (!raiz) return;
  var modo = raiz.dataset.modo || "publico";
  var slug = raiz.dataset.slug || "";
  var reduzido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- utilidades
  function h(tag, attrs, filhos) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "texto") el.textContent = v;
      else if (k === "aoClicar") el.addEventListener("click", v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined || f === false) return;
      el.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return el;
  }
  var NS = "http://www.w3.org/2000/svg";
  function iconeCheck() {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ic");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M5 12.5l4.5 4.5L19 7");
    svg.appendChild(p);
    return svg;
  }

  // ------------------------------------------------- logo proporcional (Logo.tsx)
  function ajustarLogo(img) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    var altura = Number(img.dataset.altura) || 56;
    var larguraMax = Number(img.dataset.larguraMax) || 0;
    var r = img.naturalWidth / img.naturalHeight;
    var a = altura * Math.sqrt(3 / r);
    a = Math.max(altura * 0.55, Math.min(altura * 1.5, a));
    if (larguraMax && a * r > larguraMax) a = larguraMax / r;
    img.style.height = Math.round(a) + "px";
    img.style.opacity = "1";
  }
  raiz.querySelectorAll("img[data-logo]").forEach(function (img) {
    if (img.complete) ajustarLogo(img);
    else img.addEventListener("load", function () { ajustarLogo(img); }, { once: true });
  });

  // ----------------------------------------------------- efeitos de rolagem
  function contar(alvo) {
    alvo.querySelectorAll("[data-count]").forEach(function (n) {
      if (n.dataset.done) return;
      n.dataset.done = "1";
      var fim = parseFloat(n.dataset.count || "0");
      var suf = n.dataset.suffix || "";
      var fmt = function (v) { return n.dataset.fmt === "plain" ? String(Math.round(v)) : Math.round(v).toLocaleString("pt-BR"); };
      if (reduzido) return;
      var t0 = performance.now();
      var passo = function (t) {
        var p = Math.min(1, (t - t0) / 1500);
        n.textContent = fmt(fim * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !e.target.classList.contains("in")) {
          e.target.classList.add("in");
          contar(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    raiz.querySelectorAll(".rv").forEach(function (x) { io.observe(x); });
  } else {
    raiz.querySelectorAll(".rv").forEach(function (x) { x.classList.add("in"); });
  }

  var capitulos = Array.prototype.slice.call(raiz.querySelectorAll("[data-chapter]"));
  var dots = Array.prototype.slice.call(raiz.querySelectorAll("[data-dot]"));
  var prog = raiz.querySelector("[data-progresso]");
  function barraAcoes() { return raiz.querySelector(".barra-acoes"); }

  function aoRolar() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    var ativo = capitulos[0] && capitulos[0].id;
    capitulos.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.45) ativo = s.id; });
    dots.forEach(function (a) { a.classList.toggle("on", a.dataset.dot === ativo); });
    raiz.querySelectorAll("[data-timeline]").forEach(function (tl) {
      var r = tl.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (innerHeight * 0.62 - r.top) / r.height));
      tl.style.setProperty("--p", String(p));
      var filhos = Array.prototype.slice.call(tl.children);
      filhos.forEach(function (st, i) { st.classList.toggle("on", p >= i / filhos.length + 0.015); });
    });
    var barra = barraAcoes();
    if (barra) barra.classList.toggle("on", scrollY > innerHeight * 0.9);
  }
  dots.forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var alvo = document.getElementById(a.dataset.dot);
      if (alvo) alvo.scrollIntoView({ behavior: reduzido ? "auto" : "smooth" });
    });
  });
  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);
  aoRolar();

  // --------------------------------------------- abas de selos (seção confiança)
  raiz.querySelectorAll(".ctabs").forEach(function (abas) {
    abas.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-aba]");
      if (!btn) return;
      abas.querySelectorAll("button[data-aba]").forEach(function (b) { b.classList.toggle("on", b === btn); });
      var selos = [];
      try { selos = JSON.parse(btn.dataset.selos || "[]"); } catch (_) { selos = []; }
      var antigo = abas.parentNode.querySelector(".bdgs");
      var novo = h("div", { class: "bdgs" }, selos.map(function (c, i) {
        return h("div", { class: "bdg", style: "animation-delay:" + i * 0.07 + "s" }, [
          h("div", { class: "hex" }, [h("b", { texto: c.sigla }), h("i", { texto: c.codigo })]),
          h("span", { texto: c.descricao }),
        ]);
      }));
      antigo.parentNode.replaceChild(novo, antigo); // remonta: a animação recomeça
    });
  });

  // ------------------------------------------------------------- toast (prévia)
  var toastTimer = null;
  function toast(msg) {
    var t = raiz.querySelector(".toast");
    if (!t) { t = h("div", { class: "toast" }); raiz.appendChild(t); }
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }

  // ------------------------------------------- CNPJ, telefone e e-mail (documentos.ts)
  function soDigitos(s) { return (s || "").replace(/\D/g, ""); }
  function cnpjValido(v) {
    var c = soDigitos(v);
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    function dv(base) {
      var pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      var soma = base.split("").reduce(function (s, d, i) { return s + Number(d) * pesos[i]; }, 0);
      var r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    }
    var d1 = dv(c.slice(0, 12));
    var d2 = dv(c.slice(0, 12) + d1);
    return c.endsWith("" + d1 + d2);
  }
  function formatarCnpj(v) {
    return soDigitos(v).slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  function telefoneValido(v) {
    var d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "");
    return d.length === 10 || d.length === 11;
  }
  function formatarTelefone(v) {
    var d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
    if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  }
  function emailValido(v) { return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test((v || "").trim()); }

  // ------------------------------------------------------------------- modais
  var TITULOS = { aceitar: "Aceitar a proposta", recusar: "Recusar a proposta", comentar: "Enviar uma dúvida ou comentário" };
  var motivos = [];
  try { motivos = JSON.parse(raiz.dataset.motivos || "[]"); } catch (_) { motivos = []; }
  var modalAberto = null;

  function fechar() {
    if (modalAberto) { modalAberto.remove(); modalAberto = null; }
  }
  function mostrar(fundo) {
    fechar();
    fundo.addEventListener("click", fechar);
    fundo.firstChild.addEventListener("click", function (e) { e.stopPropagation(); });
    raiz.appendChild(fundo);
    modalAberto = fundo;
    var foco = fundo.querySelector("[autofocus]");
    if (foco) foco.focus();
  }

  function marcarDecidida(status) {
    var aviso = h("div", { class: "aviso-topo" }, status === "ACEITA"
      ? ["Proposta ", h("b", { texto: "aceita" }), ". Obrigado! Nosso time entrará em contato."]
      : ["Proposta recusada. Obrigado pelo retorno."]);
    raiz.insertBefore(aviso, raiz.querySelector(".pv-progress"));
    var barra = barraAcoes();
    if (barra) barra.remove();
  }

  function enviado(titulo, status) {
    var p = h("p", { texto: titulo.indexOf("aceita") >= 0
      ? "Recebemos seus dados. Nosso time entrará em contato para enviar o contrato."
      : "Quem enviou a proposta já foi avisado." });
    var ok = h("div", { class: "ok" }, [iconeCheck()]);
    var modal = h("div", { class: "modal", style: "text-align:center" }, [
      ok, h("h3", { texto: titulo }), p,
      h("div", { class: "rodape", style: "justify-content:center" }, [
        h("button", { class: "btn", type: "button", texto: "Fechar", aoClicar: fechar }),
      ]),
    ]);
    mostrar(h("div", { class: "modal-fundo" }, [modal]));
    if (status) marcarDecidida(status);
  }

  function abrirModal(tipo) {
    if (modo === "previa") {
      toast("Prévia: no link real, o cliente registra a decisão aqui e você é avisado.");
      return;
    }
    if (!slug) return;
    var aceitar = tipo === "aceitar";
    var campos = {};
    function entrada(nome, attrs, mascara) {
      var el = h("input", attrs || {});
      if (mascara) el.addEventListener("input", function () { el.value = mascara(el.value); });
      campos[nome] = el;
      return el;
    }
    var corpo = [h("h3", { texto: TITULOS[tipo] })];
    if (aceitar) {
      var mensal = raiz.dataset.mensal || "";
      var unico = raiz.dataset.unico || "";
      corpo.push(h("p", {}, ["Investimento de ", h("b", { texto: mensal }), " por mês"]
        .concat(unico ? [" + ", h("b", { texto: unico }), " de implantação"] : [])
        .concat([". Preencha os dados para prepararmos o contrato."])));
      corpo.push(h("label", { texto: "Razão social" }), entrada("razaoSocial", { autocomplete: "organization", autofocus: true }));
      corpo.push(h("label", { texto: "CNPJ" }), entrada("cnpj", { inputmode: "numeric", placeholder: "00.000.000/0000-00" }, formatarCnpj));
      corpo.push(h("label", { texto: "Nome do sócio responsável" }), entrada("nomeSocio", { autocomplete: "name" }));
      corpo.push(h("div", { class: "modal-2" }, [
        h("div", {}, [h("label", { texto: "E-mail" }), entrada("email", { type: "email", autocomplete: "email" })]),
        h("div", {}, [h("label", { texto: "WhatsApp" }), entrada("whatsapp", { inputmode: "tel", placeholder: "(11) 91234-5678", autocomplete: "tel" }, formatarTelefone)]),
      ]));
    } else {
      corpo.push(h("label", { texto: "Seu nome" }), entrada("nome", { autofocus: true }));
      corpo.push(h("label", { texto: "Seu e-mail (opcional)" }), entrada("email", { type: "email" }));
    }
    if (tipo === "recusar") {
      var sel = h("select", {}, [h("option", { value: "", texto: "Selecione" })].concat(
        motivos.map(function (m) { return h("option", { texto: m }); })));
      campos.motivo = sel;
      corpo.push(h("label", { texto: "Motivo" }), sel);
    }
    var texto = h("textarea", { maxlength: "2000" });
    campos.texto = texto;
    corpo.push(h("label", { texto: tipo === "comentar" ? "Mensagem" : "Comentário (opcional)" }), texto);
    var erro = h("p", { class: "modal-erro", role: "alert" });
    var botao = h("button", { class: "btn gold", type: "button", texto: aceitar ? "Confirmar aceite" : "Enviar" });
    var rodape = h("div", { class: "rodape" }, [
      h("button", { class: "btn ghost", type: "button", texto: "Cancelar", aoClicar: fechar }), botao,
    ]);
    corpo.push(rodape);
    var modal = h("div", { class: "modal", role: "dialog", "aria-modal": "true" }, corpo);

    function valor(k) { return campos[k] ? campos[k].value : ""; }
    function mostrarErro(msg) {
      erro.textContent = msg;
      if (!erro.parentNode) modal.insertBefore(erro, rodape);
    }

    botao.addEventListener("click", function () {
      if (aceitar) {
        if (!valor("razaoSocial").trim()) return mostrarErro("Informe a razão social.");
        if (!cnpjValido(valor("cnpj"))) return mostrarErro("CNPJ inválido.");
        if (!valor("nomeSocio").trim()) return mostrarErro("Informe o nome do sócio responsável.");
        if (!emailValido(valor("email"))) return mostrarErro("E-mail inválido.");
        if (!telefoneValido(valor("whatsapp"))) return mostrarErro("WhatsApp inválido: informe DDD + número.");
      } else {
        if (!valor("nome").trim()) return mostrarErro("Informe seu nome.");
        if (tipo === "recusar" && !valor("motivo")) return mostrarErro("Selecione um motivo.");
        if (tipo === "comentar" && !valor("texto").trim()) return mostrarErro("Escreva sua mensagem.");
      }
      botao.disabled = true;
      botao.textContent = "Enviando...";
      if (erro.parentNode) erro.remove();
      var corpoJson = {
        acao: tipo, nome: aceitar ? valor("nomeSocio") : valor("nome"), email: valor("email"), motivo: valor("motivo"),
        texto: valor("texto"), razaoSocial: valor("razaoSocial"), cnpj: valor("cnpj"), nomeSocio: valor("nomeSocio"),
        whatsapp: valor("whatsapp"),
      };
      fetch("/api/propostas/" + encodeURIComponent(slug) + "/decisao", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpoJson),
      }).catch(function () { return null; }).then(function (r) {
        botao.disabled = false;
        botao.textContent = aceitar ? "Confirmar aceite" : "Enviar";
        if (!r || !r.ok) {
          return (r ? r.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (j) {
            mostrarErro((j && j.erro) || "Não foi possível enviar. Tente novamente.");
          });
        }
        if (aceitar) enviado("Que ótimo, proposta aceita!", "ACEITA");
        else if (tipo === "recusar") enviado("Recebemos sua resposta.", "RECUSADA");
        else enviado("Mensagem enviada!");
      });
    });

    mostrar(h("div", { class: "modal-fundo" }, [modal]));
  }

  raiz.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-acao]");
    if (btn && raiz.contains(btn)) abrirModal(btn.dataset.acao);
  });
})();
