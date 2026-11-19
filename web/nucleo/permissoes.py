"""Permissões por módulo e ação (src/lib/permissoes.ts). Guardadas em Usuario.permissoes.

Superadmin ignora tudo isto e acessa todos os módulos de todas as empresas.
"""

import json

MODULOS = {
    "painel": {"nome": "Painel", "acoes": ["ver"]},
    "propostas": {"nome": "Propostas", "acoes": ["ver", "criar", "editar", "excluir"]},
    "modelos": {"nome": "Modelos e seções", "acoes": ["ver", "criar", "editar", "excluir"]},
    "catalogo": {"nome": "Produtos e planos", "acoes": ["ver", "criar", "editar", "excluir"]},
    "clientes": {"nome": "Clientes", "acoes": ["ver", "criar", "editar", "excluir"]},
    "empresa": {"nome": "Empresa e marca", "acoes": ["ver", "editar"]},
    "usuarios": {"nome": "Usuários", "acoes": ["ver", "criar", "editar", "excluir"]},
    "auditoria": {"nome": "Auditoria", "acoes": ["ver"]},
}
NOMES_ACOES = {"ver": "Ver", "criar": "Criar", "editar": "Editar", "excluir": "Excluir"}
TODOS = list(MODULOS)


def _tudo(mods, acoes=None):
    return {m: {a: True for a in MODULOS[m]["acoes"] if acoes is None or a in acoes} for m in mods}


# Perfis prontos para preencher as permissões rapidamente (ordem da tela).
PERFIS = {
    "administrador": {
        "nome": "Administrador",
        "descricao": "Tudo nas empresas que acessa, inclusive usuários.",
        "permissoes": {"modulos": _tudo(TODOS), "propostasDeTodos": True},
    },
    "gerente": {
        "nome": "Gerente comercial",
        "descricao": "Propostas de todo o time, modelos, catálogo e clientes.",
        "permissoes": {
            "modulos": {**_tudo(["painel", "propostas", "modelos", "catalogo", "clientes"]), "empresa": {"ver": True}},
            "propostasDeTodos": True,
        },
    },
    "vendedor": {
        "nome": "Vendedor",
        "descricao": "Cria e acompanha as próprias propostas.",
        "permissoes": {
            "modulos": {
                "painel": {"ver": True},
                "propostas": {"ver": True, "criar": True, "editar": True},
                "modelos": {"ver": True},
                "catalogo": {"ver": True},
                "clientes": {"ver": True, "criar": True, "editar": True},
            },
            "propostasDeTodos": False,
        },
    },
    "leitura": {
        "nome": "Somente leitura",
        "descricao": "Visualiza tudo, sem alterar.",
        "permissoes": {
            "modulos": _tudo([m for m in TODOS if m not in ("usuarios", "auditoria")], ["ver"]),
            "propostasDeTodos": True,
        },
    },
}


def ler_permissoes(valor) -> dict:
    p = valor if isinstance(valor, dict) else {}
    return {"modulos": p.get("modulos") or {}, "propostasDeTodos": bool(p.get("propostasDeTodos"))}


def pode(usuario, modulo: str, acao: str = "ver") -> bool:
    if usuario.super_admin:
        return True
    return bool((ler_permissoes(usuario.permissoes)["modulos"].get(modulo) or {}).get(acao))


def ve_propostas_de_todos(usuario) -> bool:
    return usuario.super_admin or ler_permissoes(usuario.permissoes)["propostasDeTodos"]


def sanitizar_permissoes(p: dict) -> dict:
    """Normaliza permissões vindas de formulário (só módulos/ações conhecidos)."""
    entrada = (p or {}).get("modulos") or {}
    modulos = {}
    for m in TODOS:
        acoes = {a: True for a in MODULOS[m]["acoes"] if (entrada.get(m) or {}).get(a)}
        if acoes:
            # Qualquer ação implica poder ver o módulo
            modulos[m] = {"ver": True, **acoes}
    return {"modulos": modulos, "propostasDeTodos": bool((p or {}).get("propostasDeTodos"))}


def _canonico(p) -> str:
    return json.dumps(p, sort_keys=True)


def perfil_de(usuario) -> str:
    """Nome do perfil cujas permissões são idênticas às do usuário."""
    if usuario.super_admin:
        return "Superadministrador"
    atual = _canonico(ler_permissoes(usuario.permissoes))
    for perfil in PERFIS.values():
        if _canonico(perfil["permissoes"]) == atual:
            return perfil["nome"]
    return "Personalizado"
