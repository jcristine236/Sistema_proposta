/*
  Barra de demonstração KOLP.
  Aparece só no catálogo: mostra o código do modelo, troca a paleta ao vivo e leva ao WhatsApp.
  Na entrega ao cliente, basta remover as três tags <script> do fim do HTML.
  Parâmetros de URL: ?paleta=2 (abre na paleta nº 2) · ?cor=1b5e20 (cor da marca) · ?limpo=1 (sem barra)
*/
(function () {
  var pasta = location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "").split("/").pop();
  var modelo = (window.KOLP_MODELOS || []).filter(function (m) { return m.pasta === pasta; })[0];
  if (!modelo) return;
  var cfg = window.KOLP_CONFIG || {};
  var raiz = document.documentElement;
  var q = new URLSearchParams(location.search);

  function sobre(hex) { // cor de texto legível sobre um fundo
    var n = parseInt(hex.replace("#", ""), 16);
    var c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.42 ? "#16161a" : "#ffffff";
  }
  function definir(nome, valor) { raiz.style.setProperty("--cor-" + nome, valor); }
  function aplicar(p) {
    ["primaria", "destaque", "fundo", "superficie", "texto"].forEach(function (k) { if (p[k]) definir(k, p[k]); });
    if (p.primaria) definir("sobre-primaria", sobre(p.primaria));
    if (p.destaque) definir("sobre-destaque", sobre(p.destaque));
  }

  var inicial = Math.min(Math.max(parseInt(q.get("paleta") || "1", 10) - 1, 0), modelo.paletas.length - 1);
  aplicar(modelo.paletas[inicial]);
  var corUrl = q.get("cor");
  if (corUrl && /^[0-9a-f]{6}$/i.test(corUrl)) aplicar({ primaria: "#" + corUrl });
  if (q.get("limpo")) return;

  var css = document.createElement("style");
  css.textContent =
    ".kb{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;gap:14px;padding:9px 16px;background:#260f3d;color:#f8fafc;font:500 13px/1.2 Inter,system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 -1px 0 rgba(255,255,255,.08),0 -8px 30px rgba(38,15,61,.18)}" +
    ".kb *{box-sizing:border-box}.kb label,.kb small,.kb span,.kb b{text-transform:none;letter-spacing:normal;color:inherit;font-family:inherit}.kb-id b{white-space:nowrap}.kb a{color:inherit;text-decoration:none}" +
    ".kb-volta{display:flex;align-items:center;gap:10px;white-space:nowrap}.kb-volta img{height:22px;width:auto;display:block}.kb-volta span{opacity:.75}.kb-volta:hover span{opacity:1}.kb-seta{margin-right:-4px}" +
    ".kb-id{display:flex;flex-direction:column;gap:2px;padding-left:14px;border-left:1px solid rgba(255,255,255,.16);min-width:0}" +
    ".kb-id b{font-weight:600;letter-spacing:.04em}.kb-id span{opacity:.6;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".kb-pal{display:flex;align-items:center;gap:7px;margin-left:auto}" +
    ".kb-pal small{opacity:.6;font-size:12px;margin-right:2px}" +
    ".kb-s{width:26px;height:26px;border-radius:50%;border:2px solid #260f3d;outline:1px solid rgba(255,255,255,.3);cursor:pointer;padding:0}" +
    ".kb-s[aria-pressed=true]{outline:2px solid #ff7300}" +
    ".kb-cor{display:flex;align-items:center;gap:6px;padding:4px 9px 4px 5px;border:1px solid rgba(255,255,255,.3);border-radius:20px;cursor:pointer;font-size:12px;white-space:nowrap}" +
    ".kb-cor input{width:20px;height:20px;border:0;padding:0;background:none;cursor:pointer}" +
    ".kb-quero{background:#ff7300;color:#fff!important;font-weight:600;padding:10px 18px;border-radius:12px;white-space:nowrap}" +
    ".kb-quero:hover{background:#e66800}" +
    "body{padding-bottom:60px!important}" +
    "@media(max-width:760px){.kb{gap:9px;padding:8px 10px}.kb-txt{display:none}.kb-id{flex:none}.kb-id span,.kb-pal small,.kb-cor span{display:none}.kb-id{padding-left:9px}.kb-s{width:22px;height:22px}.kb-cor{padding:3px}.kb-quero{padding:9px 11px}}" +
    "@media(max-width:440px){.kb-volta img{display:none}.kb-seta{font-size:18px}.kb-pal{gap:5px}.kb-s{width:20px;height:20px}.kb-mod{display:none}.kb{gap:8px}}" +
    "@media print{.kb{display:none}}";
  document.head.appendChild(css);

  var barra = document.createElement("div");
  barra.className = "kb";
  barra.setAttribute("role", "region");
  barra.setAttribute("aria-label", "Demonstração KOLP");
  var msg = (cfg.mensagem || "Quero o modelo {codigo}").replace("{codigo}", modelo.codigo).replace("{nome}", modelo.nome);
  barra.innerHTML =
    '<a class="kb-volta" href="../../index.html" title="Voltar ao catálogo de modelos"><img src="../../assets/kolp-logo-branca.png" alt="KOLP" width="82" height="22"><span class="kb-seta">←</span><span class="kb-txt">Catálogo</span></a>' +
    '<div class="kb-id"><b>' + modelo.codigo + "</b><span>" + modelo.nome + " · " + modelo.nicho + "</span></div>" +
    '<div class="kb-pal"><small>Paleta</small></div>' +
    '<a class="kb-quero" target="_blank" rel="noopener" href="https://wa.me/' + (cfg.whatsapp || "") + "?text=" + encodeURIComponent(msg) + '">Quero este<span class="kb-mod"> modelo</span></a>';
  var pal = barra.querySelector(".kb-pal");
  var botoes = modelo.paletas.map(function (p, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "kb-s"; b.title = p.nome;
    b.setAttribute("aria-label", "Paleta " + p.nome);
    b.setAttribute("aria-pressed", i === inicial && !corUrl ? "true" : "false");
    b.style.background = "linear-gradient(135deg," + p.primaria + " 50%," + p.destaque + " 50%)";
    b.onclick = function () {
      aplicar(p);
      botoes.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    };
    pal.appendChild(b);
    return b;
  });
  var rotulo = document.createElement("label");
  rotulo.className = "kb-cor";
  rotulo.title = "Teste a cor da sua marca";
  rotulo.innerHTML = '<input type="color" value="' + (corUrl ? "#" + corUrl : modelo.paletas[inicial].primaria) + '" aria-label="Cor da sua marca"><span>Sua cor</span>';
  rotulo.querySelector("input").oninput = function (e) {
    aplicar({ primaria: e.target.value });
    botoes.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
  };
  pal.appendChild(rotulo);
  document.body.appendChild(barra);
})();
