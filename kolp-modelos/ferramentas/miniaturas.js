/*
  Gera as miniaturas do catálogo (miniaturas/<pasta>.jpg) fotografando cada modelo.
  Uso, na raiz do projeto:   node ferramentas/miniaturas.js            (todos)
                             node ferramentas/miniaturas.js saude-01   (só alguns)
  Requer Node e Playwright (npm i -D playwright && npx playwright install chromium).
*/
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const vm = require("vm");

const raiz = path.resolve(__dirname, "..");
const caixa = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(raiz, "dados/modelos.js"), "utf8"), caixa);
const so = process.argv.slice(2);
const fila = caixa.window.KOLP_MODELOS.filter((m) => !so.length || so.includes(m.pasta));
const ALTURA_MAX = 4600;

(async () => {
  const navegador = await chromium.launch();
  async function operario() {
    const pagina = await navegador.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 0.4, reducedMotion: "reduce" });
    for (let m; (m = fila.shift());) {
      await pagina.goto("file://" + path.join(raiz, "demo", m.pasta, "index.html") + "?limpo=1", { waitUntil: "load" });
      await pagina.evaluate(async () => {
        document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
        await document.fonts.ready;
      });
      const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
      await pagina.screenshot({
        path: path.join(raiz, "miniaturas", m.pasta + ".jpg"),
        type: "jpeg", quality: 68, fullPage: true,
        clip: { x: 0, y: 0, width: 1280, height: Math.min(altura, ALTURA_MAX) }
      });
      console.log("ok", m.codigo, m.pasta);
    }
    await pagina.close();
  }
  await Promise.all([operario(), operario(), operario(), operario()]);
  await navegador.close();
})();
