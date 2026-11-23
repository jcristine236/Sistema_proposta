"""Catálogo de blocos (tipos de seção) do editor — src/lib/blocos.ts.

`blocos.json` (exportado uma vez do antigo src/lib/blocos.ts) traz, por bloco, nome,
categoria, ícone, campos de propriedades e conteúdo padrão; também as opções de
fundo/efeito, os tipos de campo do formulário e a ordem dos ícones.
"""

import copy
import json
import secrets
from pathlib import Path

CATALOGO = json.loads((Path(__file__).parent / "blocos.json").read_text(encoding="utf-8"))
BLOCO = {b["tipo"]: b for b in CATALOGO["blocos"]}
NOMES = {t: b["nome"] for t, b in BLOCO.items()}
TIPOS_SECAO = list(BLOCO)
TIPOS_CAMPO = [t["tipo"] for t in CATALOGO["tiposCampo"]]

_ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789"


def novo_id(tipo: str) -> str:
    return f"{tipo}-{''.join(secrets.choice(_ALFABETO) for _ in range(6))}"


def padrao(tipo: str) -> dict:
    """Conteúdo inicial do bloco com id novo (`{ ...def.padrao(), id: novoId(tipo) }`)."""
    return {**copy.deepcopy(BLOCO[tipo]["padrao"]), "id": novo_id(tipo)}
