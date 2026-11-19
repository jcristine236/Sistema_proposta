"""Usuário logado, empresa ativa e checagem de permissões (src/lib/auth.ts e sessao.ts).

A sessão é a do Django (cookie pp_sessao, 12h) e guarda o id do usuário e a
`versao_sessao` do momento do login. Sair, trocar a senha ou desativar o usuário
incrementa a versão no banco, o que derruba todas as sessões abertas.
"""

from functools import wraps
from urllib.parse import quote

from django.conf import settings
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import redirect

from nucleo.models import Empresa, Usuario
from nucleo.permissoes import pode, ve_propostas_de_todos

COOKIE_EMPRESA = "pp_empresa"
SEM_PERMISSAO = "Você não tem permissão para esta ação."


class SessaoMiddleware:
    """Define request.usuario (ou None) a partir da sessão, conferindo a versão."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.usuario = None
        request.sessao_invalida = False
        uid = request.session.get("uid")
        if uid:
            u = Usuario.objects.filter(pk=uid).first()
            if u and u.ativo and u.versao_sessao == request.session.get("v"):
                request.usuario = u
            else:
                request.sessao_invalida = True
        return self.get_response(request)


def entrar(request, usuario: Usuario) -> None:
    request.session.cycle_key()
    request.session["uid"] = usuario.pk
    request.session["v"] = usuario.versao_sessao
    request.usuario = usuario


def opcoes_cookie() -> dict:
    return {
        "max_age": settings.SESSION_COOKIE_AGE,
        "httponly": True,
        "samesite": "Lax",
        "secure": not settings.MODO_HTTP,
        "path": "/",
    }


def empresas_do_usuario(usuario: Usuario) -> list[Empresa]:
    if usuario.super_admin or usuario.todas_empresas:
        return list(Empresa.objects.filter(ativo=True).order_by("nome"))
    return list(
        Empresa.objects.filter(ativo=True, membros__usuario=usuario).distinct().order_by("nome")
    )


def _carregar(request):
    """Preenche request.empresas/request.empresa. Devolve um redirect se não der."""
    if request.usuario is None:
        if request.sessao_invalida:
            return redirect("/login")
        return redirect(f"/login?voltar={quote(request.get_full_path(), safe='/?=&')}")
    empresas = empresas_do_usuario(request.usuario)
    if not empresas:
        return redirect("/login?erro=sem-empresa")
    slug = request.COOKIES.get(COOKIE_EMPRESA)
    request.empresas = empresas
    request.empresa = next((e for e in empresas if e.slug == slug), empresas[0])
    return None


def empresa_atual(request) -> Empresa:
    return request.empresa


def exige_sessao(modulo: str | None = None, acao: str = "ver", permitir_troca_senha: bool = False):
    """Para páginas do painel: exige login e, opcionalmente, uma permissão."""

    def decorador(view):
        @wraps(view)
        def envolvida(request, *args, **kwargs):
            r = _carregar(request)
            if r is not None:
                return r
            u = request.usuario
            if u.trocar_senha and not permitir_troca_senha:
                return redirect("/admin/conta?trocar=1")
            if modulo and not pode(u, modulo, acao):
                return redirect("/admin/sem-permissao")
            return view(request, *args, **kwargs)

        return envolvida

    return decorador


def exige_acao(modulo: str, acao: str):
    """Para endpoints JSON do painel: 403 {"erro": ...} em vez de redirecionar."""

    def decorador(view):
        @wraps(view)
        def envolvida(request, *args, **kwargs):
            if request.usuario is None or _carregar(request) is not None:
                return JsonResponse({"erro": SEM_PERMISSAO}, status=403)
            u = request.usuario
            if u.trocar_senha or not pode(u, modulo, acao):
                return JsonResponse({"erro": SEM_PERMISSAO}, status=403)
            return view(request, *args, **kwargs)

        return envolvida

    return decorador


def pode_agir(request, modulo: str, acao: str) -> bool:
    """Checagem para POST de formulário (que já passou por exige_sessao)."""
    u = request.usuario
    return u is not None and not u.trocar_senha and pode(u, modulo, acao)


def filtro_propostas(request) -> Q:
    """Quem não tem "propostas de todos" só vê as próprias."""
    q = Q(empresa=request.empresa)
    if not ve_propostas_de_todos(request.usuario):
        q &= Q(autor=request.usuario)
    return q
