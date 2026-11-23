"""Campos do formulário de preenchimento (src/lib/campos.ts)."""

import re
from datetime import date, timedelta

from django.utils import timezone

TIPOS_CAMPO = [
    {"tipo": "contato", "nome": "Cliente", "descricao": "Escolhe um contato cadastrado ou digita um novo nome de cliente."},
    {"tipo": "texto", "nome": "Texto curto", "descricao": "Uma linha de texto (ex.: nome do projeto)."},
    {"tipo": "textoLongo", "nome": "Texto longo", "descricao": "Parágrafo livre (ex.: escopo, premissas)."},
    {"tipo": "numero", "nome": "Número", "descricao": "Quantidade inteira com mínimo e máximo (ex.: dispositivos)."},
    {"tipo": "moeda", "nome": "Valor (R$)", "descricao": "Valor em reais (ex.: taxa de implantação)."},
    {"tipo": "data", "nome": "Data", "descricao": "Data com padrão relativo a hoje (ex.: validade = hoje + 15 dias)."},
    {"tipo": "selecao", "nome": "Seleção", "descricao": "Lista fixa de opções."},
    {"tipo": "checkbox", "nome": "Sim/Não", "descricao": "Liga ou desliga um trecho da proposta."},
    {"tipo": "produto", "nome": "Produto/Plano", "descricao": "Item do catálogo da empresa, com opção de plano personalizado."},
    {"tipo": "desconto", "nome": "Desconto", "descricao": "Percentual ou valor fixo, com alerta acima do limite de aprovação."},
    {"tipo": "lista", "nome": "Lista de observações", "descricao": "Pares título + descrição adicionados livremente."},
    {"tipo": "adicionais", "nome": "Adicionais precificados", "descricao": "Itens extras com nome e valor (e opcionalmente quantidade), somados ao total mensal."},
]


def valores_padrao(campos: list[dict], hoje: date | None = None) -> dict:
    """Valores iniciais do formulário. "Hoje" é a data de Brasília (o Next usava UTC)."""
    hoje = hoje or timezone.localdate()
    dados: dict = {}
    for c in campos:
        t, cid = c.get("tipo"), c.get("id")
        if t == "contato":
            dados[cid] = {"nome": ""}
        elif t in ("texto", "textoLongo"):
            dados[cid] = c.get("padrao", "")
        elif t in ("numero", "moeda"):
            dados[cid] = c.get("padrao", 0)
        elif t == "data":
            dados[cid] = (hoje + timedelta(days=c.get("padraoDias", 15))).isoformat()
        elif t == "selecao":
            opcoes = c.get("opcoes") or []
            dados[cid] = c.get("padrao", opcoes[0]["valor"] if opcoes else "")
        elif t == "checkbox":
            dados[cid] = c.get("padrao", False)
        elif t == "produto":
            dados[cid] = {"codigo": c.get("padrao", "")}
        elif t == "desconto":
            dados[cid] = {"tipo": "nenhum", "valor": 0}
        elif t == "lista":
            dados[cid] = [{"titulo": "", "descricao": ""}]
        elif t == "adicionais":
            dados[cid] = []
    return dados


def data_valida(v) -> bool:
    """AAAA-MM-DD que existe no calendário (o Next aceitava 31/02 e quebrava ao salvar)."""
    if not isinstance(v, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v, re.ASCII):
        return False
    try:
        # Ano limitado: 9999-12-31 às 23:59 de Brasília passa do ano 10000 em UTC e o banco não lê de volta
        return 2000 <= date.fromisoformat(v).year <= 2999
    except ValueError:
        return False


def validar(campos: list[dict], dados: dict) -> list[str]:
    """Mensagens de erro de preenchimento (vazio = válido)."""
    erros = []
    for c in campos:
        v = dados.get(c["id"])
        if c["tipo"] == "data" and v not in (None, "") and not data_valida(v):
            erros.append(f'Data inválida no campo "{c["rotulo"]}".')
            continue
        if not c.get("obrigatorio"):
            continue
        vazio = v is None or v == ""
        if not vazio and c["tipo"] == "contato":
            vazio = not (isinstance(v, dict) and str(v.get("nome") or "").strip())
        if not vazio and c["tipo"] == "produto":
            vazio = not (isinstance(v, dict) and v.get("codigo"))
        if vazio:
            erros.append(f'Preencha o campo "{c["rotulo"]}".')
    return erros
