"""Motor de cálculo do investimento (src/lib/precificacao.ts).

Usa float e Math.round como o JS, para que os centavos batam com o Next.
"""

import math

from propostas.regras.js import js_round, parse_float, truthy


def num(v) -> float:
    """Número positivo e finito; o resto vira 0."""
    n = float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else parse_float(v)
    return n if math.isfinite(n) and n > 0 else 0


def arred(v: float) -> float:
    return js_round(v * 100) / 100


def _limpo(x):
    """Inteiros que vieram como float voltam a int (o JSON do JS não tem 8.0)."""
    if isinstance(x, float) and x.is_integer():
        return int(x)
    return x


def catalogo_do_modelo(campos: list[dict], catalogo: list[dict]) -> list[dict]:
    """Só os produtos das categorias usadas pelos campos "produto" do modelo."""
    cats = {c.get("categoria") for c in campos if c.get("tipo") == "produto"}
    return [p for p in catalogo if p.get("categoria") in cats] if cats else catalogo


def resolver_produto(valor, catalogo: list[dict]) -> dict | None:
    if not isinstance(valor, dict) or not truthy(valor.get("codigo")):
        return None
    if valor["codigo"] == "personalizado" and valor.get("personalizado"):
        p = valor["personalizado"]
        nome = str(p.get("nome") or "").strip() or "Personalizado"
        return {"codigo": "personalizado", "nome": nome, "preco": _limpo(num(p.get("preco"))), "atributos": p.get("atributos") or {}}
    for p in catalogo:
        if p.get("codigo") == valor["codigo"]:
            return {"codigo": p["codigo"], "nome": p["nome"], "preco": _limpo(num(p.get("preco"))), "atributos": p.get("atributos")}
    return None


def calcular(regras: dict, dados: dict, catalogo: list[dict]) -> dict:
    regras = regras or {}
    rec = regras.get("recorrente")
    base = {"rotulo": "Mensalidade", "valor": 0}
    if rec:
        v = dados.get(rec["base"]["campo"])
        if isinstance(v, dict) and "codigo" in v:
            produto = resolver_produto(v, catalogo)
            base = {"rotulo": f"Plano {produto['nome']}" if produto else "Plano", "valor": produto["preco"] if produto else 0}
            if produto:
                base["produto"] = produto
        else:
            base = {"rotulo": "Mensalidade", "valor": _limpo(num(v))}

    adicionais = []
    for a in (rec or {}).get("adicionais") or []:
        quantidade = math.floor(num(dados.get(a["campo"])))
        extras = max(0, quantidade - a["inclusos"])
        adicionais.append({
            "campo": a["campo"],
            "quantidade": quantidade,
            "inclusos": a["inclusos"],
            "extras": extras,
            "valorUnitario": a["valorUnitario"],
            "rotulo": a["rotuloSingular"] if extras == 1 else a["rotuloPlural"],
            "rotuloLinha": a["rotuloLinha"],
            "unidade": a["unidade"][0] if quantidade == 1 else a["unidade"][1],
            "valor": _limpo(arred(extras * a["valorUnitario"])),
        })

    lista_extras = (dados.get(rec["extras"]["campo"]) if rec and rec.get("extras") else None) or []
    extras = []
    for e in lista_extras:
        if not e or not str(e.get("nome") or "").strip() or not num(e.get("valor")) > 0:
            continue
        q = e.get("quantidade")
        quantidade = math.floor(num(q)) if truthy(q) and isinstance(q, (int, float)) and q > 0 else 1
        valor_unit = num(e.get("valor"))
        extras.append({"nome": e["nome"].strip(), "quantidade": quantidade, "valorUnit": _limpo(valor_unit),
                       "valor": _limpo(arred(valor_unit * quantidade))})

    subtotal = arred(base["valor"] + sum(a["valor"] for a in adicionais) + sum(e["valor"] for e in extras))

    d = dados.get(regras["desconto"]["campo"]) if regras.get("desconto") else None
    d = d if isinstance(d, dict) else {}
    tipo = d.get("tipo") or "nenhum"
    informado = num(d.get("valor"))
    valor_desc = subtotal * informado / 100 if tipo == "pct" else informado if tipo == "valor" else 0
    valor_desc = arred(min(valor_desc, subtotal))
    pct = (valor_desc / subtotal) * 100 if subtotal else 0
    limite = (regras.get("desconto") or {}).get("limitePct")

    unicos = [{"rotulo": u["rotulo"], "valor": _limpo(arred(num(dados.get(u["campo"]))))} for u in regras.get("unicos") or []]

    desconto = {"tipo": tipo, "informado": _limpo(informado), "valor": _limpo(valor_desc), "pct": _limpo(pct),
                "acimaLimite": limite is not None and pct > limite}
    if limite is not None:
        desconto["limitePct"] = limite
    return {
        "base": base,
        "adicionais": adicionais,
        "extras": extras,
        "subtotal": _limpo(subtotal),
        "desconto": desconto,
        "totalMensal": _limpo(arred(subtotal - valor_desc)),
        "unicos": unicos,
        "totalUnico": _limpo(arred(sum(u["valor"] for u in unicos))),
    }
