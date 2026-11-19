"""Renderiza uma proposta completa (capa + seções), igual ao PropostaView do Next.

Cada tipo de seção tem um template em propostas/templates/proposta/secoes/<tipo>.html.
Aqui fica só o que é cálculo de apresentação (classes, atributos, listas derivadas).
"""

import re

from django.template.loader import render_to_string
from django.utils.html import format_html

from nucleo.tema import variaveis_css
from propostas.regras.contexto import condicao, preencher

FUNDOS = {"branco": "white", "tinta": "tint", "escuro": "navy"}

# tipo -> (fundo padrão, classe extra)
PADROES = {
    "abertura": ("white", "intro"),
    "sobre": ("tint", ""),
    "confianca": ("white", ""),
    "marcas": ("tint", "ecos"),
    "comparativo": ("white", ""),
    "especificacoes": ("tint", ""),
    "investimento": ("navy", ""),
    "resultados": ("tint", ""),
    "cronograma": ("white", ""),
    "texto": ("white", ""),
    "fechamento": ("navy", "cta"),
    "titulo": ("white", "bloco-titulo"),
    "imagem": ("white", "bloco-imagem"),
    "imagemTexto": ("white", "bloco-imgtxt"),
    "tabela": ("tint", ""),
    "planos": ("tint", ""),
    "video": ("white", ""),
    "faq": ("white", ""),
    "campoLista": ("white", ""),
}

TIPOS_SECAO = ["capa", *PADROES]


def atributos_secao(s: dict, padrao: str, extra: str = "") -> str:
    fundo = FUNDOS.get(s.get("fundo") or "") or padrao
    classe = f"ch {fundo} {extra}".strip()
    attrs = format_html('class="{}" id="{}" data-secao="{}"', classe, s["id"], s["id"])
    if s.get("capitulo"):
        attrs += format_html(' data-chapter="{}"', s["capitulo"])
    if s.get("efeito") and s["efeito"] != "padrao":
        attrs += format_html(' data-efeito="{}"', s["efeito"])
    return attrs


def _preparar(s: dict, ctx: dict) -> dict:
    """Valores derivados que o template precisa, por tipo de seção."""
    t = s["tipo"]
    p: dict = {}
    if t != "capa":
        padrao, extra = PADROES[t]
        base = s
        if t == "fechamento":
            base = {**s, "capitulo": s.get("capitulo") or "Fechamento"}
        if t == "imagem":
            extra = f"bloco-imagem {'total' if s.get('largura') == 'total' else ''}"
        p["attrs"] = atributos_secao(base, padrao, extra)
    if t == "sobre":
        letras = (s.get("letras") or ctx["empresa"]["nome"]).upper()
        p["valores"] = [
            {**v, "letra": letras[i] if i < len(letras) else (v.get("palavra") or " ")[0]}
            for i, v in enumerate(s.get("valores") or [])
        ]
    elif t == "confianca":
        grupos = s.get("grupos") or []
        p["selos"] = grupos[0].get("selos", []) if grupos else []
    elif t == "marcas":
        itens = s.get("itens") or []
        meio = -(-len(itens) // 2)
        p["linha1"] = itens[:meio] * 4
        p["linha2"] = list(reversed(itens[meio:])) * 4
    elif t == "planos":
        campo = s.get("destacarCampo")
        valor = ctx.get(campo) if campo else None
        escolhido = str((valor or {}).get("nome") or "").lower() if campo and isinstance(valor, dict) else ""
        if campo and valor is not None and not isinstance(valor, dict):
            escolhido = ""
        planos = []
        for pl in s.get("planos") or []:
            on = pl.get("nome", "").lower() == escolhido if escolhido else bool(pl.get("destaque"))
            planos.append({**pl, "on": on, "selo_txt": "Plano proposto" if on and escolhido else (pl.get("selo") or "Recomendado"),
                           "mostra_selo": on or bool(pl.get("selo")),
                           "ancora_limpa": re.sub(r"[^\w-]", "", pl.get("ancora") or "", flags=re.ASCII),
                           "itens_validos": [x for x in pl.get("itens") or [] if x]})
        p["planos"] = planos
    elif t == "tabela":
        tabela = s.get("tabela") or {}
        colunas = tabela.get("colunas") or []
        p["colunas"] = colunas
        p["tem_cabecalho"] = any(colunas)
        p["linhas"] = [[(l[j] if j < len(l) and l[j] is not None else "") for j in range(len(colunas))] for l in tabela.get("linhas") or []]
    elif t == "campoLista":
        p["itens"] = ctx.get(s.get("campo")) or []
    elif t == "resultados":
        p["blocos"] = [
            {**b, "itens_txt": [x if isinstance(x, str) else (x or {}).get("titulo") for x in b.get("itens") or []]}
            for b in s.get("blocos") or []
        ]
    elif t in ("imagem", "imagemTexto"):
        from propostas.regras.urls import url_imagem, url_link

        p["src"] = url_imagem(s.get("imagem"))
        p["link"] = url_link(s.get("botaoUrl")) if t == "imagemTexto" else None
    elif t == "video":
        from propostas.regras.urls import url_video

        p["src"] = url_video(s.get("url"))
    elif t == "capa":
        p["linhas_titulo"] = preencher(s.get("titulo"), ctx).split("\n")
    return p


def renderizar_proposta(secoes, ctx, tema, modo="publico", slug=None, decisao=None, codigo=None, aviso_previa=None,
                        extras: dict | None = None) -> str:
    """HTML do div.pp inteiro (o que o PropostaView gera no servidor).

    `extras` vira atributos data-* do div.pp para o JS (motivos de recusa e valores
    formatados que aparecem no modal de aceite).
    """
    visiveis = [s for s in secoes if condicao(s.get("mostrarSe"), ctx)]
    blocos = []
    for s in visiveis:
        if s["tipo"] == "campoLista" and not (ctx.get(s.get("campo")) or []):
            continue  # CampoLista vazio não renderiza (mas o dot continua)
        blocos.append({"s": s, "p": _preparar(s, ctx), "template": f"proposta/secoes/{s['tipo']}.html",
                       "logo": (tema.get("logoClaro") or tema.get("logo")) if s["tipo"] == "capa" else None})
    return render_to_string("proposta/proposta.html", {
        "ctx": ctx,
        "tema": tema,
        "estilo": variaveis_css(tema),
        "modo": modo,
        "slug": slug,
        "decisao": decisao,
        "codigo": codigo,
        "aviso_previa": aviso_previa,
        "dots": [s for s in visiveis if s.get("capitulo") or s["tipo"] == "capa"],
        "blocos": blocos,
        "extras": extras or {},
    })
