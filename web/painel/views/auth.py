"""Login, logout e troca de empresa (src/app/login/acoes.ts e src/app/admin/acoes.ts)."""

import re
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from nucleo.auditoria import auditar
from nucleo.auth import COOKIE_EMPRESA, entrar, exige_sessao, opcoes_cookie
from nucleo.limite import ip_cliente, permitir
from nucleo.models import Usuario

MAX_FALHAS = 5
BLOQUEIO_MIN = 15
JANELA = 15 * 60
BLOQUEIO = "Muitas tentativas incorretas. Aguarde 15 minutos e tente novamente."
GENERICO = "E-mail ou senha incorretos."
VOLTAR_OK = re.compile(r"^/admin(/[\w\-/?=&.]*)?$")
# Hash de referência: compara mesmo quando o e-mail não existe (tempo de resposta igual)
HASH_FALSO = make_password("senha-inexistente-referencia")


def _tela(request, voltar, erro=None):
    return render(
        request,
        "painel/login.html",
        {"voltar": voltar, "erro": erro, "sem_empresa": request.GET.get("erro") == "sem-empresa"},
    )


def login(request):
    if request.method != "POST":
        return _tela(request, request.GET.get("voltar") or "/admin")

    email = request.POST.get("email", "").strip().lower()[:160]
    senha = request.POST.get("senha", "")[:200]
    voltar = request.POST.get("voltar") or "/admin"
    ip = ip_cliente(request)

    if not permitir(f"login-ip:{ip}", 20, JANELA):
        return _tela(request, voltar, BLOQUEIO)
    # Mesmo limite para e-mails inexistentes: não revela quais contas existem
    if not permitir(f"login-email:{email}", 8, JANELA):
        return _tela(request, voltar, BLOQUEIO)

    u = Usuario.objects.filter(email=email).first()
    agora = timezone.now()
    if u and u.bloqueado_ate and u.bloqueado_ate > agora:
        check_password(senha, HASH_FALSO)
        return _tela(request, voltar, BLOQUEIO)

    ok = check_password(senha, u.password if u else HASH_FALSO)
    if not u or not ok or not u.ativo:
        if u:
            # Linha travada: tentativas em paralelo contam todas
            with transaction.atomic():
                atual = Usuario.objects.select_for_update().only("falhas_login").get(pk=u.pk)
                falhas = atual.falhas_login + 1
                if falhas >= MAX_FALHAS:
                    Usuario.objects.filter(pk=u.pk).update(
                        falhas_login=0, bloqueado_ate=agora + timedelta(minutes=BLOQUEIO_MIN)
                    )
                else:
                    Usuario.objects.filter(pk=u.pk).update(falhas_login=falhas)
            if falhas >= MAX_FALHAS:
                auditar(request, usuario=u, acao="LOGIN_BLOQUEADO", descricao=email)
                return _tela(request, voltar, BLOQUEIO)
            auditar(request, usuario=u, acao="LOGIN_FALHOU", descricao=email)
        else:
            auditar(request, acao="LOGIN_FALHOU", descricao=f"e-mail inexistente: {email}")
        return _tela(request, voltar, GENERICO)

    Usuario.objects.filter(pk=u.pk).update(falhas_login=0, bloqueado_ate=None, ultimo_acesso=agora)
    auditar(request, usuario=u, acao="LOGIN")
    entrar(request, u)
    if u.trocar_senha:
        return redirect("/admin/conta?trocar=1")
    return redirect(voltar if VOLTAR_OK.match(voltar) else "/admin")


@require_POST
def sair(request):
    u = request.usuario
    if u is not None:
        # Sair encerra a sessão em todos os dispositivos
        Usuario.objects.filter(pk=u.pk).update(versao_sessao=u.versao_sessao + 1)
        auditar(request, usuario=u, acao="LOGOUT")
    request.session.flush()
    r = redirect("/login")
    r.delete_cookie(COOKIE_EMPRESA, path="/")
    return r


@require_POST
@exige_sessao(permitir_troca_senha=True)
def empresa_ativa(request):
    slug = request.POST.get("slug", "")
    r = redirect("/admin")
    if any(e.slug == slug for e in request.empresas):
        r.set_cookie(COOKIE_EMPRESA, slug, **opcoes_cookie())
    return r


def raiz(request):
    return redirect("/admin")
