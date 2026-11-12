# Catálogo de modelos KOLP

Vitrine de modelos de sites e landing pages, feita para ficar em `kolp.com.br/modelos`.
É tudo estático (HTML, CSS e JS): não precisa de banco de dados nem de instalação.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Página do catálogo, com busca e filtros |
| `dados/modelos.js` | Lista de modelos, opções de filtro, WhatsApp da KOLP |
| `assets/` | Estilo e script do catálogo, e a barra de demonstração (`demo.js`) |
| `demo/<pasta>/` | Um modelo por pasta: `index.html`, `style.css` e `img/` |
| `miniaturas/` | Imagens dos cartões do catálogo (geradas automaticamente) |
| `ferramentas/miniaturas.js` | Gera as miniaturas |

## Antes de publicar

Em `dados/modelos.js`, troque `whatsapp` pelo número da KOLP (DDI + DDD + número, só dígitos).

## Publicar na HostGator

Envie **o conteúdo desta pasta** para `public_html/modelos/` pelo Gerenciador de Arquivos do cPanel ou por FTP,
incluindo o arquivo `.htaccess`. O catálogo abre em `kolp.com.br/modelos`.

## Adicionar um modelo

1. Copie uma pasta de `demo/` e renomeie (ex.: `imobiliaria-01`).
2. Edite o `index.html` e o `style.css`. As cores ficam no bloco `:root`, no topo do CSS, sempre com os mesmos nomes
   (`--cor-primaria`, `--cor-destaque`, `--cor-fundo`, `--cor-superficie`, `--cor-texto`).
3. Acrescente o modelo em `dados/modelos.js`, com código, nicho, tipo, estilo e de três a quatro paletas.
4. Gere a miniatura: `node ferramentas/miniaturas.js imobiliaria-01`.

Um nicho novo aparece nos filtros sozinho. Para fixar a ordem, inclua-o em `KOLP_FILTROS`.

## Entregar um modelo a um cliente

1. Copie a pasta do modelo.
2. No `:root` do `style.css`, coloque as cores do cliente (use a barra de demonstração para testar antes).
3. Troque textos, fotos e o número em `data-whatsapp` e nos links `wa.me`.
4. Apague as duas linhas de `<script>` marcadas como "Demonstração KOLP" no fim do HTML e a tag `<meta name="robots" content="noindex">`.

## Links úteis para vendas

- Catálogo já filtrado: `kolp.com.br/modelos/?nicho=Advocacia` (os filtros ficam na URL; é só copiar o endereço).
- Demonstração já com a cor do cliente: `.../demo/clinica-01/?cor=1b5e20`.
- Demonstração em uma paleta pronta: `.../demo/clinica-01/?paleta=3`.

## Fotos

As fotos das demonstrações vêm do Unsplash (uso livre, inclusive comercial) e servem de exemplo.
No site do cliente, prefira fotos reais do negócio.
