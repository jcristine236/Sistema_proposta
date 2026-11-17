# Catálogo de modelos KOLP

Vitrine de modelos de sites e landing pages, feita para ficar em `kolp.com.br/modelos`.
É tudo estático (HTML, CSS e JS): não precisa de banco de dados nem de instalação.

Hoje são **130 modelos**: 13 nichos, cada um em 10 layouts diferentes, com 4 paletas prontas por modelo.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Página do catálogo, com busca e filtros |
| `dados/config.js` | WhatsApp e mensagem padrão da KOLP (**edite aqui**) |
| `dados/modelos.js` | Lista de modelos e filtros (arquivo gerado, não edite à mão) |
| `assets/` | Estilo e script do catálogo, barra de demonstração (`demo.js`), logo e favicon da KOLP |
| `demo/<nicho>-NN/` | Um modelo por pasta: `index.html` e `style.css` (gerados) |
| `fotos/` | Fotos de exemplo por nicho e retratos, compartilhadas entre os modelos |
| `miniaturas/` | Imagens dos cartões do catálogo (geradas) |
| `compartilhar/` | Imagens de prévia do link no WhatsApp, 1200×630 (geradas) |
| `ferramentas/familias/` | Os 10 layouts: um `.js` (estrutura) e um `.css` (visual) para cada |
| `ferramentas/conteudo/` | Textos de exemplo de cada nicho |
| `ferramentas/gerar.js` | Monta todos os modelos a partir dos layouts e dos conteúdos |
| `ferramentas/miniaturas.js` | Fotografa os modelos para o catálogo |
| `ferramentas/compartilhar.js` | Gera as imagens de prévia do link (rode depois do `gerar.js`) |

## Antes de publicar

O WhatsApp da KOLP (o mesmo do kolp.com.br) já está em `dados/config.js`; para trocar, use DDI + DDD + número, só dígitos.

A identidade visual segue o kolp.com.br: roxo `#511268`, laranja `#FF7300`, texto `#260F3D`, fonte Inter e cantos de 12 px. As cores ficam no `:root` de `assets/catalogo.css`; as logos são `assets/kolp-logo.png` (fundo claro) e `assets/kolp-logo-branca.png` (fundo escuro).

## Publicar na HostGator

Envie para `public_html/modelos/`, pelo Gerenciador de Arquivos do cPanel ou por FTP:
`index.html`, `.htaccess`, `assets/`, `dados/`, `demo/`, `fotos/` e `miniaturas/`.
A pasta `ferramentas/` não precisa ir. O catálogo abre em `kolp.com.br/modelos`.

## Alterar ou ampliar o catálogo

Depois de qualquer alteração abaixo, rode na raiz do projeto:

```bash
node ferramentas/gerar.js
```

```bash
node ferramentas/miniaturas.js
```

- **Novo nicho:** copie um arquivo de `ferramentas/conteudo/`, troque os textos, crie `fotos/<nicho>/` com cinco ou mais fotos
  (`1.jpg`, `2.jpg`…, 1400 × 930) e inclua o nome na lista `NICHOS` de `gerar.js`. Isso cria 10 modelos de uma vez.
- **Novo layout:** crie um par `.js` + `.css` em `ferramentas/familias/` e inclua o nome na lista `FAMILIAS`. Isso cria um modelo novo em cada nicho.
- **Nova paleta:** acrescente em `paletas`, no `.js` do layout.
- **Texto de um nicho:** edite o arquivo em `ferramentas/conteudo/`.

As miniaturas exigem Node e Playwright (`npm i -D playwright` e `npx playwright install chromium`).

## Entregar um modelo a um cliente

1. Copie a pasta do modelo em `demo/` e as fotos que ele usa em `fotos/`.
2. No `:root` do `style.css`, coloque as cores do cliente (use a barra de demonstração para testar antes).
3. Troque textos, fotos e o número em `data-whatsapp` e nos links `wa.me`.
4. Apague as três linhas de `<script>` marcadas como "Demonstração KOLP" no fim do HTML , a tag `<meta name="robots" content="noindex">` e o bloco de etiquetas `og:` marcado como "Demonstração KOLP" no `<head>`.

## Links úteis para vendas

- Catálogo já filtrado: `kolp.com.br/modelos/?nicho=Advocacia` (os filtros ficam na URL; é só copiar o endereço).
- Todos os nichos em um mesmo layout: `kolp.com.br/modelos/?layout=Noturno`.
- Demonstração já com a cor do cliente: `.../demo/saude-02/?cor=1b5e20`.
- Demonstração em uma paleta pronta: `.../demo/saude-02/?paleta=3`.

## Fotos

As fotos vêm do Unsplash (uso livre, inclusive comercial) e servem de exemplo.
No site do cliente, prefira fotos reais do negócio.

## Prévia do link no WhatsApp

O catálogo e cada demonstração já têm as etiquetas de prévia (`og:`), apontando para `https://kolp.com.br/modelos/`. Se o endereço mudar (por exemplo para um subdomínio), troque `ENDERECO` em `ferramentas/gerar.js` e as URLs do `<head>` do `index.html`, e rode de novo `gerar.js` e `compartilhar.js`. O WhatsApp guarda a prévia em cache: um link já enviado pode demorar a mostrar a versão nova.
