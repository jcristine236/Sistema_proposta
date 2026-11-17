/*
  Gera as imagens de prévia de link (compartilhar/<pasta>.jpg, 1200×630) usadas quando
  um modelo ou o catálogo é enviado pelo WhatsApp ou pelas redes sociais.
  Uso, na raiz do projeto:   node ferramentas/compartilhar.js            (todos + catálogo)
                             node ferramentas/compartilhar.js saude-01   (só alguns)
*/
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const vm = require("vm");

const raiz = path.resolve(__dirname, "..");
const saida = path.join(raiz, "compartilhar");
fs.mkdirSync(saida, { recursive: true });
const caixa = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(raiz, "dados/modelos.js"), "utf8"), caixa);
const so = process.argv.slice(2);
const fila = caixa.window.KOLP_MODELOS.filter((m) => !so.length || so.includes(m.pasta));
const logo = "file://" + path.join(raiz, "assets/kolp-logo-branca.png");

/* Selo com a logo da KOLP e o código do modelo, no canto da imagem */
function selo({ codigo, logoUrl }) {
  const s = document.createElement("div");
  s.style.cssText = "position:fixed;left:28px;bottom:28px;z-index:99999;display:flex;align-items:center;gap:14px;" +
    "padding:12px 18px 12px 16px;background:#260f3d;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);" +
    "font:600 22px/1 Inter,system-ui,sans-serif;color:#fff;letter-spacing:.02em";
  s.innerHTML = '<img src="' + logoUrl + '" style="height:30px;width:auto;display:block">' +
    '<span style="width:1px;height:26px;background:rgba(255,255,255,.25)"></span>' +
    '<span>' + codigo + '</span><span style="background:#ff7300;border-radius:999px;padding:7px 12px;font-size:17px;font-weight:600">Modelo de site</span>';
  document.body.appendChild(s);
}

async function preparar(pagina) {
  await pagina.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    await document.fonts.ready;
  });
}

(async () => {
  const navegador = await chromium.launch();
  if (!so.length) {
    const p = await navegador.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
    await p.goto("file://" + path.join(raiz, "index.html"), { waitUntil: "load" });
    await preparar(p);
    await p.screenshot({ path: path.join(saida, "catalogo.jpg"), type: "jpeg", quality: 80 });
    await p.close();
    console.log("ok catálogo");
  }
  async function operario() {
    const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
    for (let m; (m = fila.shift());) {
      await pagina.goto("file://" + path.join(raiz, "demo", m.pasta, "index.html") + "?limpo=1", { waitUntil: "load" });
      await preparar(pagina);
      await pagina.evaluate(selo, { codigo: m.codigo, logoUrl: logo });
      await pagina.waitForTimeout(150);
      await pagina.screenshot({ path: path.join(saida, m.pasta + ".jpg"), type: "jpeg", quality: 74 });
      console.log("ok", m.codigo, m.pasta);
    }
    await pagina.close();
  }
  await Promise.all([operario(), operario(), operario(), operario()]);
  await navegador.close();
})();
