// Comportamentos do painel que no Next eram componentes React (sem build, sem eval).
// Tudo por atributos data-*, para funcionar com a CSP com nonce.
(function () {
  "use strict";

  // Logo com "tamanho visual" igual para todas as empresas (src/components/Logo.tsx)
  var PROPORCAO_REF = 3;
  function ajustarLogo(img) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    var altura = Number(img.dataset.altura) || 56;
    var larguraMax = Number(img.dataset.larguraMax) || 0;
    var r = img.naturalWidth / img.naturalHeight;
    var h = altura * Math.sqrt(PROPORCAO_REF / r);
    h = Math.max(altura * 0.55, Math.min(altura * 1.5, h));
    if (larguraMax && h * r > larguraMax) h = larguraMax / r;
    img.style.height = Math.round(h) + "px";
    img.style.opacity = "1";
  }
  window.ajustarLogos = function (raiz) {
    (raiz || document).querySelectorAll("img[data-logo]").forEach(function (img) {
      if (img.complete) ajustarLogo(img);
      else img.addEventListener("load", function () { ajustarLogo(img); }, { once: true });
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    window.ajustarLogos();

    // Troca de empresa na lateral: envia e trava o select até recarregar
    document.querySelectorAll("form[data-empresa-ativa] select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        sel.form.submit();
        sel.disabled = true;
      });
    });
  });

  // Botão "Salvando..." / "Entrando..." enquanto o formulário envia
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (e.defaultPrevented || !form.dataset || !form.dataset.enviando) return;
    var btn = form.querySelector("button:not([type=button])");
    if (btn) {
      btn.textContent = form.dataset.enviando;
      setTimeout(function () { btn.disabled = true; }, 0);
    }
  });

  // Confirmação antes de ações destrutivas: <button data-confirmar="Excluir X?">
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-confirmar]");
    if (el && !window.confirm(el.dataset.confirmar)) e.preventDefault();
  });

  // "Copiar link": <button data-copiar="https://...">
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-copiar]");
    if (!el) return;
    e.preventDefault();
    var texto = el.textContent;
    Promise.resolve(navigator.clipboard && navigator.clipboard.writeText(el.dataset.copiar)).catch(function () {});
    el.textContent = "Copiado!";
    setTimeout(function () { el.textContent = texto; }, 2000);
  });

  // Contrato no D4Sign: <button data-contrato="/admin/propostas/<id>/contrato"> (BotaoContrato.tsx)
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-contrato]");
    if (!btn) return;
    e.preventDefault();
    var antigo = btn.parentNode.querySelector(".alerta");
    if (antigo) antigo.remove();
    if (!window.confirm("Gerar o contrato no D4Sign e enviar para assinatura (cliente + empresa)?")) return;
    var texto = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Gerando contrato…";
    var m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    fetch(btn.dataset.contrato, { method: "POST", credentials: "same-origin", headers: { "X-CSRFToken": m ? decodeURIComponent(m[1]) : "" } })
      .then(function (r) { return r.json().catch(function () { return { erro: "Falha ao gerar o contrato no D4Sign." }; }); },
            function () { return { erro: "Falha ao gerar o contrato no D4Sign." }; })
      .then(function (r) {
        btn.disabled = false;
        btn.textContent = texto;
        var msg = document.createElement("div");
        msg.className = "alerta " + (r.erro ? "erro" : "ok");
        msg.style.marginTop = "10px";
        msg.textContent = r.erro || "Contrato criado no D4Sign e enviado para assinatura.";
        btn.parentNode.appendChild(msg);
      });
  });
})();
