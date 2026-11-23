"""Contexto da proposta e substituição de {{variáveis}} (src/lib/contexto.ts)."""

import math
import re
from datetime import datetime

from django.utils import timezone

from nucleo.formato import brl, data_br, numero_br
from propostas.regras.campos import data_valida
from propostas.regras.js import js_num, js_number, js_round, js_string, truthy
from propostas.regras.precificacao import calcular, resolver_produto

__all__ = ["montar_contexto", "preencher", "condicao", "caminho", "js_num"]


def montar_contexto(campos, precificacao, dados, catalogo, empresa, agora: datetime | None = None) -> dict:
    ctx: dict = {}
    cliente = "Cliente"
    validade_iso = None
    observacoes: list = []

    for c in campos:
        v = dados.get(c["id"])
        t = c["tipo"]
        if t == "contato":
            nome = v.get("nome") if isinstance(v, dict) else None
            cliente = str(nome).strip() if isinstance(nome, str) and nome.strip() else "Cliente"
            ctx[c["id"]] = cliente
        elif t == "produto":
            p = resolver_produto(v, catalogo)
            ctx[c["id"]] = {"nome": p["nome"], "preco": p["preco"], **(p["atributos"] or {})} if p else {"nome": "-"}
        elif t == "data":
            validade_iso = v if data_valida(v) else None
            ctx[c["id"]] = data_br(v)
        elif t == "lista":
            observacoes = [
                x for x in (v or [])
                if str(x.get("titulo") or "").strip() and str(x.get("descricao") or "").strip()
            ]
            ctx[c["id"]] = observacoes
        else:
            ctx[c["id"]] = v

    expirada = False
    if validade_iso:
        try:
            fim = datetime.fromisoformat(f"{validade_iso}T23:59:59-03:00")
            expirada = fim < (agora or timezone.now())
        except ValueError:
            expirada = False

    return {
        **ctx,
        "cliente": cliente,
        "empresa": empresa,
        "validade": data_br(validade_iso),
        "validadeISO": validade_iso,
        "expirada": expirada,
        "observacoes": observacoes,
        "calc": calcular(precificacao, dados, catalogo),
    }


def caminho(obj, path: str):
    o = obj
    for k in path.split("."):
        if isinstance(o, dict):
            o = o.get(k)
        elif isinstance(o, list) and truthy(o):
            o = o[int(k)] if k.isdigit() and int(k) < len(o) else None
        else:
            return None
    return o


def _filtro_brl(v):
    n = js_number(v)
    return brl(0 if math.isnan(n) else n)


def _filtro_inteiro(v):
    n = js_number(v)
    return numero_br(js_round(0 if math.isnan(n) else n))


FILTROS = {
    "brl": _filtro_brl,
    "data": lambda v: data_br(v),
    "maiusculas": lambda v: ("" if v is None else js_string(v)).upper(),
    "inteiro": _filtro_inteiro,
}

_VAR = re.compile(r"\{\{\s*([\w.]+)\s*(?:\|\s*(\w+)\s*)?\}\}", re.ASCII)


def _valor(v) -> str:
    if v is None:
        return ""
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return numero_br(v)
    return js_string(v)


def preencher(texto: str | None, ctx: dict) -> str:
    """Substitui {{caminho}} e {{caminho|filtro}} pelos valores do contexto."""
    if not texto:
        return ""

    def troca(m):
        v = caminho(ctx, m.group(1))
        filtro = m.group(2)
        if filtro and filtro in FILTROS:
            return FILTROS[filtro](v)
        return _valor(v)

    return _VAR.sub(troca, texto)


def condicao(expr: str | None, ctx: dict) -> bool:
    """"campo", "!campo", "observacoes" (lista não vazia)."""
    if not expr:
        return True
    neg = expr.startswith("!")
    v = caminho(ctx, expr[1:] if neg else expr)
    ok = len(v) > 0 if isinstance(v, list) else truthy(v)
    return not ok if neg else ok
