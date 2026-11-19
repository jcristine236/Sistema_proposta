"""Minha conta: nome, WhatsApp e troca de senha (src/app/admin/usuarios/acoes.ts:salvarConta)."""

import re

from django.db.models import F
from django.shortcuts import render

from nucleo.auditoria import auditar
from nucleo.auth import entrar, exige_sessao
from nucleo.models import Usuario
from nucleo.senha import validar_senha


def _tela(request, **extra):
    u = request.usuario
    ctx = {
        "obrigatorio": u.trocar_senha,
        "nome": u.nome,
        "whatsapp": u.whatsapp or "",
        **extra,
    }
    return render(request, "painel/conta.html", ctx)


@exige_sessao(permitir_troca_senha=True)
def conta(request):
    if request.method != "POST":
        return _tela(request)

    u = request.usuario
    campos = {k: request.POST.get(k, "") for k in ("nome", "whatsapp", "senhaAtual", "novaSenha", "confirmar")}
    nome = campos["nome"].strip()
    if not nome or len(nome) > 120 or len(campos["whatsapp"]) > 20 or any(
        len(campos[k]) > 200 for k in ("senhaAtual", "novaSenha", "confirmar")
    ):
        return _tela(request, erro="Dados inválidos.")

    u.nome = nome
    u.whatsapp = re.sub(r"[^\d+]", "", campos["whatsapp"]) or None
    trocou = False
    if campos["novaSenha"] or u.trocar_senha:
        if not u.check_password(campos["senhaAtual"]):
            return _tela(request, erro="Senha atual incorreta.", nome=nome, whatsapp=campos["whatsapp"])
        if campos["novaSenha"] != campos["confirmar"]:
            return _tela(request, erro="A confirmação não confere com a nova senha.", nome=nome, whatsapp=campos["whatsapp"])
        problema = validar_senha(campos["novaSenha"])
        if problema:
            return _tela(request, erro=problema, nome=nome, whatsapp=campos["whatsapp"])
        if u.check_password(campos["novaSenha"]):
            return _tela(request, erro="A nova senha precisa ser diferente da atual.", nome=nome, whatsapp=campos["whatsapp"])
        u.set_password(campos["novaSenha"])
        u.trocar_senha = False
        trocou = True

    u.save(update_fields=["nome", "whatsapp", "password", "trocar_senha", "atualizado_em"])
    if trocou:
        # Encerra as outras sessões e renova a atual
        Usuario.objects.filter(pk=u.pk).update(versao_sessao=F("versao_sessao") + 1)
        u.refresh_from_db()
        entrar(request, u)
        auditar(request, usuario=u, acao="TROCAR_SENHA")
    request.usuario = u
    # Como no Next, a tela recarrega com o estado novo: sem o aviso de troca
    # obrigatória (e, por isso, sem o link "Ir para o painel").
    return _tela(request, ok="Dados e senha atualizados." if trocou else "Dados atualizados.")
