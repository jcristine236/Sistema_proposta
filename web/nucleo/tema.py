"""Identidade visual de cada empresa (Empresa.tema): só cores e logos (src/lib/tema.ts)."""

import re

CORES_TEMA = ["primaria", "primaria2", "destaque", "destaqueSuave", "destaqueTexto", "neutra", "tinta"]

TEMA_PADRAO = {
    "primaria": "#0D1B3E",
    "primaria2": "#16295A",
    "destaque": "#C9A84C",
    "destaqueSuave": "#FBF6E8",
    "destaqueTexto": "#9A7F2F",
    "neutra": "#B0B8C1",
    "tinta": "#EEF2FA",
    "logo": "",
}

FONTE_TITULO = "Space Grotesk"
FONTE_TEXTO = "Inter"
FONTE_NUMEROS = "JetBrains Mono"
# Fontes da proposta e do editor (inclui Space Grotesk)
FONTES_URL = (
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700"
    "&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
)
# Fontes do layout raiz (painel e login)
FONTES_PAINEL_URL = (
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700"
    "&family=JetBrains+Mono:wght@500;600&display=swap"
)

_HEX = re.compile(r"^#[0-9a-f]{6}$", re.I)


def tema_de(valor: dict | None) -> dict:
    t = {**TEMA_PADRAO, **(valor or {})}
    for k in CORES_TEMA:
        if not isinstance(t.get(k), str) or not _HEX.match(t[k]):
            t[k] = TEMA_PADRAO[k]
    return t


def variaveis_css(t: dict) -> str:
    """Variáveis CSS do tema no formato de um atributo style (como o React gera)."""
    pares = [
        ("--primary", t["primaria"]),
        ("--primary-2", t["primaria2"]),
        ("--accent", t["destaque"]),
        ("--accent-soft", t["destaqueSuave"]),
        ("--accent-ink", t["destaqueTexto"]),
        ("--neutral", t["neutra"]),
        ("--tint", t["tinta"]),
        ("--font-title", f"'{FONTE_TITULO}', system-ui, sans-serif"),
        ("--font-text", f"'{FONTE_TEXTO}', system-ui, sans-serif"),
        ("--font-num", f"'{FONTE_NUMEROS}', ui-monospace, monospace"),
    ]
    return ";".join(f"{k}:{v}" for k, v in pares)
