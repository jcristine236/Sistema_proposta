"""Validação, no servidor, do que o editor de modelos envia (src/lib/validacao.ts).

O conteúdo é JSON livre por bloco: além do formato, confere limites de tamanho,
profundidade e os endereços de imagem/vídeo/link. As mensagens seguem as do zod 3
usado no Next, porque aparecem na tela do editor.
"""

import json
import math
import re

from propostas.blocos import TIPOS_CAMPO, TIPOS_SECAO, novo_id
from propostas.regras.js import js_number, js_string
from propostas.regras.urls import url_imagem, url_link, url_video

MAX_TEXTO = 8000
MAX_JSON = 600_000  # ~600 KB por modelo

_ID = re.compile(r"[a-z][a-z0-9_-]{0,60}", re.I | re.ASCII)
_MOSTRAR_SE = re.compile(r"!?[A-Za-z0-9_.]*")
_VARIAVEL = re.compile(r"[a-z][a-zA-Z0-9_]{0,39}")
FUNDOS = ["padrao", "branco", "tinta", "escuro"]
EFEITOS = ["padrao", "nenhum", "subir", "esquerda", "direita", "zoom", "desfocar"]
RESERVADAS = {"calc", "empresa", "validadeISO", "expirada"}


def js_len(s: str) -> int:
    """String.length do JS (unidades UTF-16)."""
    return len(s.encode("utf-16-le")) // 2


def _tipo_js(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, (int, float)):
        return "number"
    if isinstance(v, str):
        return "string"
    if isinstance(v, list):
        return "array"
    return "object"


def conferir_valores(v, prof: int = 0) -> str | None:
    if prof > 8:
        return "Estrutura aninhada demais."
    if isinstance(v, str):
        return "Texto muito longo." if js_len(v) > MAX_TEXTO else None
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, int):
        return None if abs(v) < 2**1024 else "Número inválido."
    if isinstance(v, float):
        return None if math.isfinite(v) else "Número inválido."
    if isinstance(v, list):
        if len(v) > 200:
            return "Lista com itens demais."
        for x in v:
            e = conferir_valores(x, prof + 1)
            if e:
                return e
        return None
    if isinstance(v, dict):
        if len(v) > 60:
            return "Objeto com campos demais."
        for k, x in v.items():
            if k in ("__proto__", "constructor", "prototype"):
                return "Campo inválido."
            e = conferir_valores(x, prof + 1)
            if e:
                return e
        return None
    return "Valor inválido."


# ---- mini zod -------------------------------------------------------------

FALTA = object()  # chave ausente (undefined), diferente de null


def _texto(v, *, obrigatorio=True, maximo=None, minimo=None, regex=None, msg_regex="Invalid", msg_min=None):
    """Mensagem do primeiro problema de um z.string() com checagens, ou None."""
    if v is FALTA:
        return "Required" if obrigatorio else None
    if not isinstance(v, str):
        return f"Expected string, received {_tipo_js(v)}"
    if minimo is not None and js_len(v) < minimo:
        return msg_min or f"String must contain at least {minimo} character(s)"
    if maximo is not None and js_len(v) > maximo:
        return f"String must contain at most {maximo} character(s)"
    if regex is not None and not regex.fullmatch(v):
        return msg_regex
    return None


def _enum(v, opcoes, *, k_ausente=False):
    """Primeiro problema de um z.enum(); `k_ausente` = chave obrigatória que não veio."""
    if v is None and k_ausente:
        return "Required"
    esperado = " | ".join(f"'{o}'" for o in opcoes)
    if not isinstance(v, str):
        return f"Expected {esperado}, received {_tipo_js(v)}"
    return None if v in opcoes else f"Invalid enum value. Expected {esperado}, received '{v}'"


def _erro_secao(v) -> str | None:
    if not isinstance(v, dict):
        return f"Expected object, received {_tipo_js(v)}"
    checagens = [
        lambda: _texto(v.get("id", FALTA), regex=_ID, msg_regex="Identificador inválido"),
        lambda: _enum(v.get("tipo"), TIPOS_SECAO, k_ausente="tipo" not in v),
        lambda: _opc_texto(v, "capitulo", maximo=80),
        lambda: _opc_texto(v, "numero", maximo=6),
        lambda: _opc_texto(v, "mostrarSe", maximo=60, regex=_MOSTRAR_SE),
        lambda: _opc_enum(v, "fundo", FUNDOS),
        lambda: _opc_enum(v, "efeito", EFEITOS),
    ]
    for c in checagens:
        e = c()
        if e:
            return e
    return None


def _opc_texto(d, k, **kw):
    if k not in d:
        return None
    v = d[k]
    if v is None:
        return "Expected string, received null"
    return _texto(v, **kw)


def _opc_enum(d, k, opcoes):
    if k not in d:
        return None
    v = d[k]
    return _enum(v, opcoes)


def _limpar_urls(s: dict) -> dict:
    if isinstance(s.get("imagem"), str) and s["imagem"] and not url_imagem(s["imagem"]):
        s["imagem"] = ""
    if isinstance(s.get("botaoUrl"), str) and s["botaoUrl"] and not url_link(s["botaoUrl"]):
        s["botaoUrl"] = ""
    if s.get("tipo") == "video" and isinstance(s.get("url"), str) and s["url"] and not url_video(s["url"]):
        s["url"] = ""
    return s


def validar_secao(v) -> dict:
    e = _erro_secao(v)
    if e:
        return {"erro": f"Seção inválida: {e}"}
    e = conferir_valores(v)
    if e:
        return {"erro": e}
    return {"ok": _limpar_urls(dict(v))}


def validar_secoes(v) -> dict:
    if not isinstance(v, list) or len(v) > 60:
        return {"erro": "Lista de seções inválida."}
    out, ids = [], set()
    for s in v:
        r = validar_secao(s)
        if "erro" in r:
            return r
        if r["ok"]["id"] in ids:
            r["ok"]["id"] = novo_id(r["ok"]["tipo"])
        ids.add(r["ok"]["id"])
        out.append(r["ok"])
    return {"ok": out}


def _erro_campo(c) -> str | None:
    if not isinstance(c, dict):
        return f"Expected object, received {_tipo_js(c)}"
    return (_texto(c.get("id", FALTA), regex=_VARIAVEL,
                   msg_regex="A variável do campo deve começar com letra e ter só letras, números ou _")
            or _enum(c.get("tipo"), TIPOS_CAMPO, k_ausente="tipo" not in c)
            or _texto(c.get("rotulo", FALTA), minimo=1, maximo=120, msg_min="Todo campo precisa de rótulo"))


def validar_campos(v) -> dict:
    if not isinstance(v, list) or len(v) > 60:
        return {"erro": "Lista de campos inválida."}
    ids = set()
    for c in v:
        e = _erro_campo(c)
        if e:
            return {"erro": e}
        if c["id"] in ids:
            return {"erro": f"Variável repetida: {c['id']}"}
        if c["id"] in RESERVADAS:
            return {"erro": f"“{c['id']}” é um nome reservado. Escolha outra variável."}
        ids.add(c["id"])
    e = conferir_valores(v)
    return {"erro": e} if e else {"ok": v}


def _g(o, k):
    return o.get(k) if isinstance(o, dict) else None


def _num_ou_zero(v):
    """`Number(v) || 0`, guardando inteiros como int."""
    n = js_number(v)
    if math.isnan(n) or n == 0:
        return 0
    return int(n) if n.is_integer() and abs(n) < 2**53 else n


def _str(v) -> str:
    """`String(v ?? "")`."""
    return "" if v is None else js_string(v)


def _indice(v, i):
    if isinstance(v, (list, str)) and len(v) > i:
        return v[i]
    return None


def validar_precificacao(v, campos: list) -> dict:
    e = conferir_valores(v)
    if e:
        return {"erro": e}
    p = v if isinstance(v, dict) else {}
    ids = {c.get("id") for c in campos if isinstance(c, dict)}

    def existe(i):
        return not i or (isinstance(i, str) and i in ids)

    limpo: dict = {}
    rec = _g(p, "recorrente")
    base = _g(_g(rec, "base"), "campo")
    if base and existe(base):
        adicionais = _g(rec, "adicionais")
        limpo["recorrente"] = {
            "base": {"campo": base},
            "adicionais": [
                {"campo": a["campo"], "inclusos": _num_ou_zero(a.get("inclusos")),
                 "valorUnitario": _num_ou_zero(a.get("valorUnitario")),
                 "rotuloSingular": _str(a.get("rotuloSingular")), "rotuloPlural": _str(a.get("rotuloPlural")),
                 "rotuloLinha": _str(a.get("rotuloLinha")),
                 "unidade": [_str(_indice(a.get("unidade"), 0)), _str(_indice(a.get("unidade"), 1))]}
                for a in (adicionais if isinstance(adicionais, list) else [])
                if isinstance(a, dict) and a.get("campo") and existe(a.get("campo"))
            ],
        }
        extras = _g(_g(rec, "extras"), "campo")
        if extras and existe(extras):
            limpo["recorrente"]["extras"] = {"campo": extras}
    desc = _g(p, "desconto")
    if _g(desc, "campo") and existe(desc["campo"]):
        limpo["desconto"] = {"campo": desc["campo"]}
        if "limitePct" in desc and desc["limitePct"] is not None:
            limpo["desconto"]["limitePct"] = desc["limitePct"]
    unicos = _g(p, "unicos")
    limpo["unicos"] = [
        {"campo": u["campo"], "rotulo": _str(u.get("rotulo"))}
        for u in (unicos if isinstance(unicos, list) else [])
        if isinstance(u, dict) and u.get("campo") and existe(u.get("campo"))
    ]
    return {"ok": limpo}


def tamanho_ok(*v) -> bool:
    return js_len(json.dumps(list(v), ensure_ascii=False, separators=(",", ":"))) <= MAX_JSON
