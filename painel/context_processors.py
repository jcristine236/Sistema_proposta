"""Dados da casca do painel (lateral, tema) — src/app/admin/layout.tsx e Lateral.tsx."""

import re

from nucleo.permissoes import MODULOS, pode
from nucleo.tema import tema_de, variaveis_css

# Paths SVG dos ícones do menu (viewBox 0 0 24 24), iguais aos do Lateral.tsx.
ICONES = {
    "painel": '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z"></path>',
    "propostas": '<path d="M7 3h7l5 5v13H7z"></path><path d="M14 3v5h5M10 13h6M10 17h6"></path>',
    "nova": '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path>',
    "modelos": '<rect x="3" y="3" width="7" height="9" rx="1.5"></rect><rect x="14" y="3" width="7" height="5" rx="1.5"></rect><rect x="14" y="12" width="7" height="9" rx="1.5"></rect><rect x="3" y="16" width="7" height="5" rx="1.5"></rect>',
    "catalogo": '<path d="M3 7l9-4 9 4-9 4z"></path><path d="M3 7v10l9 4 9-4V7M12 11v10"></path>',
    "contatos": '<circle cx="9" cy="8" r="3"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path><circle cx="17" cy="9" r="2.5"></circle><path d="M17 14c2.8 0 4.5 2 4.5 5"></path>',
    "empresa": '<path d="M4 21V5l8-3 8 3v16"></path><path d="M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2"></path>',
    "usuarios": '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path>',
    "auditoria": '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z"></path><path d="M9 12l2 2 4-4"></path>',
    "empresas": '<rect x="3" y="7" width="7" height="14" rx="1"></rect><rect x="14" y="3" width="7" height="18" rx="1"></rect>',
    "conta": '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="10" r="3"></circle><path d="M6.5 18.5c1.5-2 3.4-3 5.5-3s4 1 5.5 3"></path>',
}

# (grupo, href, rótulo, ícone, módulo) — "nova" = propostas.criar; "super" = superAdmin
MENU = [
    (None, "/admin", "Painel", "painel", "painel"),
    ("Propostas", "/admin/propostas", "Propostas", "propostas", "propostas"),
    (None, "/admin/propostas/nova", "Nova proposta", "nova", "nova"),
    (None, "/admin/modelos", "Modelos", "modelos", "modelos"),
    ("Cadastros", "/admin/catalogo", "Produtos e planos", "catalogo", "catalogo"),
    (None, "/admin/contatos", "Clientes", "contatos", "clientes"),
    ("Configurações", "/admin/empresa", "Empresa e marca", "empresa", "empresa"),
    (None, "/admin/usuarios", "Usuários", "usuarios", "usuarios"),
    (None, "/admin/empresas", "Empresas", "empresas", "super"),
    (None, "/admin/auditoria", "Auditoria", "auditoria", "auditoria"),
    (None, "/admin/conta", "Minha conta", "conta", None),
]

_PROPOSTA_INTERNA = re.compile(r"^/admin/propostas/(?!nova)")


def _ativo(href: str, path: str) -> bool:
    if href == "/admin":
        return path == "/admin"
    if href == "/admin/propostas":
        return path == href or bool(_PROPOSTA_INTERNA.match(path))
    return path.startswith(href)


def montar_menu(usuario, path: str) -> list[dict]:
    troca = usuario.trocar_senha
    modulos = [m for m in MODULOS if not troca and pode(usuario, m, "ver")]
    pode_nova = not troca and pode(usuario, "propostas", "criar")

    itens, grupo_corrente = [], None
    for grupo, href, rotulo, icone, modulo in MENU:
        grupo_corrente = grupo or grupo_corrente
        if modulo == "nova":
            visivel = pode_nova
        elif modulo == "super":
            visivel = usuario.super_admin
        elif modulo:
            visivel = modulo in modulos
        else:
            visivel = True
        if visivel:
            itens.append({"g": grupo_corrente, "href": href, "rotulo": rotulo, "icone": ICONES[icone],
                          "on": _ativo(href, path)})
    anterior = None
    for item in itens:
        item["cabecalho"] = item["g"] if item["g"] and item["g"] != anterior else None
        anterior = item["g"]
    return itens


def painel(request):
    empresa = getattr(request, "empresa", None)
    usuario = getattr(request, "usuario", None)
    if empresa is None or usuario is None:
        return {}
    tema = tema_de(empresa.tema)
    return {
        "usuario": usuario,
        "empresa": empresa,
        "empresas": request.empresas,
        "tema": tema,
        "estilo_tema": variaveis_css(tema),
        "menu": montar_menu(usuario, request.path),
    }
