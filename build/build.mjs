// Build de produção das 3 opções de site da Refrimaia (HostGator / Apache)
// Uso: npm install && npm run build
// Saída: dist/<opção>/ (arquivos prontos) e zips/refrimaia-<opção>.zip
import { readdir, readFile, writeFile, mkdir, rm, cp, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import CleanCSS from 'clean-css';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(ROOT, '../sites');
const DIST = path.join(ROOT, 'dist');
const ZIPS = path.join(ROOT, 'zips');
const SITE_URL = (process.env.SITE_URL || 'https://www.refrimaia.com.br').replace(/\/$/, '');

const HTACCESS = `# Refrimaia: configuração para hospedagem Apache (HostGator)
Options -Indexes
DirectoryIndex index.html

# Força HTTPS. Ative (remova os # das 4 linhas abaixo) depois que o cadeado
# do SSL gratuito (AutoSSL) estiver ativo no cPanel para o domínio.
# <IfModule mod_rewrite.c>
#   RewriteEngine On
#   RewriteCond %{HTTPS} off
#   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
# </IfModule>

# Compressão
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript application/json image/svg+xml text/plain text/xml application/xml
</IfModule>

# Cache no navegador (CSS e JS têm versão no nome do link, então podem ficar 1 ano)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Cabeçalhos de segurança básicos
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`;

const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const sitemap = (pages) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE_URL}/${p === 'index.html' ? '' : p}</loc></url>`).join('\n')}
</urlset>
`;

const HTML_OPTS = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
};

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

async function sizeOf(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile()) total += (await stat(path.join(e.parentPath ?? e.path, e.name))).size;
  }
  return total;
}

async function buildOption(name) {
  const src = path.join(SRC, name);
  const out = path.join(DIST, name);
  await cp(src, out, { recursive: true });

  // CSS
  const cssPath = path.join(out, 'css/style.css');
  const cssIn = await readFile(cssPath, 'utf8');
  const css = new CleanCSS({ level: 2 }).minify(cssIn);
  if (css.errors.length) throw new Error(`${name}: CSS: ${css.errors.join('; ')}`);
  await writeFile(cssPath, css.styles);

  // JS
  const jsPath = path.join(out, 'js/main.js');
  const jsIn = await readFile(jsPath, 'utf8');
  const js = await minifyJs(jsIn, { compress: true, mangle: true, format: { comments: false } });
  await writeFile(jsPath, js.code);

  const vCss = hash(css.styles);
  const vJs = hash(js.code);

  // HTML (com versão nos links de CSS/JS para o cache longo funcionar)
  const pages = (await readdir(out)).filter((f) => f.endsWith('.html')).sort();
  const report = [];
  for (const p of pages) {
    const file = path.join(out, p);
    let html = await readFile(file, 'utf8');
    const before = Buffer.byteLength(html);
    html = html
      .replace('href="css/style.css"', `href="css/style.css?v=${vCss}"`)
      .replace('src="js/main.js"', `src="js/main.js?v=${vJs}"`);
    html = await minifyHtml(html, HTML_OPTS);
    await writeFile(file, html);
    report.push(`${p} ${kb(before)} → ${kb(Buffer.byteLength(html))}`);
  }
  report.push(`style.css ${kb(Buffer.byteLength(cssIn))} → ${kb(Buffer.byteLength(css.styles))}`);
  report.push(`main.js ${kb(Buffer.byteLength(jsIn))} → ${kb(Buffer.byteLength(js.code))}`);

  await writeFile(path.join(out, '.htaccess'), HTACCESS);
  await writeFile(path.join(out, 'robots.txt'), ROBOTS);
  await writeFile(path.join(out, 'sitemap.xml'), sitemap(['index.html', 'sobre.html', 'servicos.html', 'contato.html'].filter((p) => pages.includes(p))));

  // Zip com os arquivos na raiz (extrair direto dentro de public_html)
  const zip = path.join(ZIPS, `refrimaia-${name}.zip`);
  execFileSync('zip', ['-r', '-q', '-X', zip, '.'], { cwd: out });

  console.log(`\n${name}  (total ${kb(await sizeOf(out))}, zip ${kb((await stat(zip)).size)})`);
  for (const r of report) console.log('  ' + r);
}

await rm(DIST, { recursive: true, force: true });
await rm(ZIPS, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await mkdir(ZIPS, { recursive: true });

const options = (await readdir(SRC, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name.startsWith('opcao-'))
  .map((d) => d.name)
  .sort();
for (const name of options) await buildOption(name);
console.log(`\nPronto: ${options.length} opções em dist/ e zips/ (SITE_URL=${SITE_URL})`);
