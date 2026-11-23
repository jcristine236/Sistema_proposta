"""Tags dos templates da proposta (equivalentes aos helpers de Secoes.tsx)."""

import json
import re
from pathlib import Path

from django import template
from django.utils.html import conditional_escape, format_html
from django.utils.safestring import mark_safe

from nucleo.formato import brl as _brl
from nucleo.formato import numero_br as _numero_br
from propostas.regras.contexto import preencher
from propostas.regras.js import js_num as _js_num

register = template.Library()

_RENDER = Path(__file__).resolve().parent.parent / "render"
ICONES = json.loads((_RENDER / "icones.json").read_text(encoding="utf-8"))
DATACENTER = (_RENDER / "datacenter.html").read_text(encoding="utf-8").strip()
_NEGRITO = re.compile(r"(\*\*[^*]+\*\*)")


def rico_html(texto, ctx) -> str:
    """Texto com {{variáveis}} e **negrito**, sem HTML arbitrário."""
    partes = _NEGRITO.split(preencher(texto, ctx))
    return mark_safe("".join(
        f"<b>{conditional_escape(p[2:-2])}</b>" if p.startswith("**") and p.endswith("**") else str(conditional_escape(p))
        for p in partes
    ))


def icone_html(nome, classe="ic") -> str:
    interno = ICONES.get(nome) or ICONES["check"]
    return mark_safe(f'<svg class="{classe}" viewBox="0 0 24 24" aria-hidden="true">{interno}</svg>')


@register.simple_tag(takes_context=True)
def rico(context, texto):
    return rico_html(texto, context["ctx"])


@register.simple_tag(takes_context=True)
def pre(context, texto):
    """preencher() do Next; o resultado é escapado pelo Django."""
    return preencher(texto, context["ctx"])


@register.simple_tag
def icone(nome):
    return icone_html(nome)


@register.simple_tag
def datacenter():
    return mark_safe(DATACENTER)


@register.simple_tag
def atraso(base, passo, i, modulo=0):
    """--d do React: base + (i % modulo) * passo, convertido como String() do JS."""
    if modulo:
        i = i % modulo
    return _js_num(float(base) + i * float(passo))


@register.simple_tag
def logo(src, alt, altura, largura_max):
    """Componente Logo: altura inicial fixa e invisível até o JS ajustar a proporção."""
    return format_html(
        '<img src="{}" alt="{}" data-logo data-altura="{}" data-largura-max="{}" '
        'style="height:{}px;width:auto;max-width:100%;opacity:0;transition:opacity .25s;display:block">',
        src, alt, altura, largura_max, altura,
    )


@register.filter
def brl(v):
    return _brl(v)


@register.filter
def numero_br(v):
    return _numero_br(v)


@register.filter
def js_num(v):
    return _js_num(v)


@register.filter
def json_attr(v):
    """JSON para um atributo data-* (o Django escapa as aspas)."""
    return json.dumps(v, ensure_ascii=False)


@register.filter
def linhas(texto):
    return str(texto).split("\n")


@register.filter
def item(lista, i):
    try:
        return lista[i]
    except (IndexError, KeyError, TypeError):
        return None
