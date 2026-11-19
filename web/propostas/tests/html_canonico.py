"""Árvore canônica de HTML para comparar a saída do Django com a do React.

Ignora: ordem de atributos e de classes, espaços repetidos, nós só de espaço,
<link rel="preload"> (o React 19 injeta) e os atributos de gancho do nosso JS.
"""

import re
from html.parser import HTMLParser

VAZIOS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
GANCHOS_JS = {"data-logo", "data-altura", "data-largura-max", "data-acao", "data-aba", "data-selos",
              "data-proposta", "data-slug", "data-modo", "data-motivos", "data-mensal", "data-unico",
              "data-enviando", "data-confirmar", "data-copiar", "data-empresa-ativa",
              "data-abas", "data-aba-form", "data-aba-previa", "data-gerar", "data-form-proposta", "data-resumo"}
_NUM = re.compile(r"-?\d+\.\d+")


def _estilo(v: str) -> str:
    partes = []
    for p in v.split(";"):
        if ":" not in p:
            continue
        k, val = p.split(":", 1)
        val = _NUM.sub(lambda m: f"{float(m.group()):.4f}".rstrip("0").rstrip("."), val.strip())
        partes.append(f"{k.strip()}:{val}")
    return ";".join(partes)


class _Arvore(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.raiz = ["#raiz", (), []]
        self.pilha = [self.raiz]

    def _no(self, tag, attrs):
        d = {}
        for k, v in attrs:
            if k in GANCHOS_JS:
                continue
            v = "" if v is None else v
            if k == "class":
                v = " ".join(sorted(v.split()))
            elif k == "style":
                v = _estilo(v)
            d[k] = v
        return [tag, tuple(sorted(d.items())), []]

    def handle_starttag(self, tag, attrs):
        if tag == "link" and dict(attrs).get("rel") == "preload":
            return
        no = self._no(tag, attrs)
        self.pilha[-1][2].append(no)
        if tag not in VAZIOS:
            self.pilha.append(no)

    def handle_startendtag(self, tag, attrs):
        if tag == "link" and dict(attrs).get("rel") == "preload":
            return
        self.pilha[-1][2].append(self._no(tag, attrs))

    def handle_endtag(self, tag):
        if tag in VAZIOS:
            return
        for i in range(len(self.pilha) - 1, 0, -1):
            if self.pilha[i][0] == tag:
                del self.pilha[i:]
                return

    def handle_data(self, data):
        filhos = self.pilha[-1][2]
        if filhos and isinstance(filhos[-1], str):
            filhos[-1] += data
        else:
            filhos.append(data)


def _limpar(no):
    if isinstance(no, str):
        return no
    tag, attrs, filhos = no
    saida = []
    for f in filhos:
        if isinstance(f, str):
            t = re.sub(r"\s+", " ", f)
            if not t.strip():
                continue
            if saida and isinstance(saida[-1], str):
                saida[-1] += t
            else:
                saida.append(t)
        else:
            saida.append(_limpar(f))
    return (tag, attrs, tuple(saida))


def canonico(html: str):
    p = _Arvore()
    p.feed(html)
    p.close()
    return _limpar(p.raiz)


def primeira_diferenca(a, b, caminho="") -> str | None:
    if isinstance(a, str) or isinstance(b, str):
        return None if a == b else f"{caminho}: texto {a!r} != {b!r}"
    if a[0] != b[0] or a[1] != b[1]:
        return f"{caminho}/{a[0]}: {a[0]}{dict(a[1])} != {b[0]}{dict(b[1])}"
    for i, (x, y) in enumerate(zip(a[2], b[2])):
        d = primeira_diferenca(x, y, f"{caminho}/{a[0]}[{i}]")
        if d:
            return d
    if len(a[2]) != len(b[2]):
        extra = a[2][len(b[2]):] or b[2][len(a[2]):]
        return f"{caminho}/{a[0]}: {len(a[2])} filhos != {len(b[2])}; sobra {str(extra[0])[:200]}"
    return None
