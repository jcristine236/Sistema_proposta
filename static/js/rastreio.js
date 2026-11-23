// Rastreamento de leitura no navegador do cliente (antes src/components/proposta/rastreio.ts):
// - registra a abertura (uma "visualização" por sessão de leitura);
// - mede o tempo em cada seção (a que cruza 45% da altura da tela), pausando com a aba oculta;
// - envia os tempos acumulados a cada 15s e ao sair da página (sendBeacon).
(function () {
  "use strict";

  var raiz = document.querySelector("[data-proposta]");
  if (!raiz || raiz.dataset.modo !== "publico" || !raiz.dataset.slug) return;
  var slug = raiz.dataset.slug;
  var INTERVALO_MS = 15000;

  function viewerId() {
    try {
      var id = localStorage.getItem("pp_viewer");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("pp_viewer", id);
      }
      return id;
    } catch (_) {
      return "anonimo";
    }
  }

  var visualizacaoId = null;
  var secaoAtual = null;
  var inicio = null;
  var pendente = {};
  var totalPendente = 0;
  var visivel = !document.hidden;

  function fecharTrecho() {
    if (secaoAtual && inicio !== null) {
      var seg = (performance.now() - inicio) / 1000;
      pendente[secaoAtual] = (pendente[secaoAtual] || 0) + seg;
      totalPendente += seg;
    }
    inicio = visivel && secaoAtual ? performance.now() : null;
  }

  function enviar(final) {
    fecharTrecho();
    if (!visualizacaoId || totalPendente < 1) return;
    var secoes = {};
    Object.keys(pendente).forEach(function (k) {
      var v = Math.round(pendente[k]);
      if (v > 0) secoes[k] = v;
    });
    var corpo = JSON.stringify({ acao: "tempo", slug: slug, visualizacaoId: visualizacaoId, total: Math.round(totalPendente), secoes: secoes });
    pendente = {};
    totalPendente = 0;
    if (final && navigator.sendBeacon) navigator.sendBeacon("/api/rastreio", new Blob([corpo], { type: "application/json" }));
    else fetch("/api/rastreio", { method: "POST", body: corpo, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(function () {});
  }

  fetch("/api/rastreio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao: "abrir", slug: slug, viewerId: viewerId() }),
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { visualizacaoId = (j && j.visualizacaoId) || null; })
    .catch(function () {});

  var secoes = Array.prototype.slice.call(raiz.querySelectorAll("[data-secao]"));
  function detectar() {
    var ativa = secoes[0] ? secoes[0].dataset.secao : null;
    secoes.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.45) ativa = s.dataset.secao; });
    if (ativa !== secaoAtual) {
      fecharTrecho();
      secaoAtual = ativa;
      inicio = visivel ? performance.now() : null;
    }
  }

  detectar();
  window.addEventListener("scroll", detectar, { passive: true });
  document.addEventListener("visibilitychange", function () {
    fecharTrecho();
    visivel = !document.hidden;
    inicio = visivel && secaoAtual ? performance.now() : null;
    if (!visivel) enviar(true);
  });
  window.addEventListener("pagehide", function () { enviar(true); });
  setInterval(function () { enviar(false); }, INTERVALO_MS);
})();
