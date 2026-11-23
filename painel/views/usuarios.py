"""Usuários do painel (src/app/admin/usuarios/** e src/components/admin/FormUsuario.tsx).

A lista e a tela do usuário são páginas comuns; o formulário (que no Next é um
componente React com estado) é controlado por static/js/cadastros.js, que fala
com os endpoints JSON salvar e redefinir-senha (com o token CSRF).
"""

import copy
import json
import re
import secrets

from django.db import transaction
from django.db.models import F, Q
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from nucleo.auditoria import auditar
from nucleo.auth import SEM_PERMISSAO, exige_acao, exige_sessao
from nucleo.models import Empresa, Membro, Usuario
from nucleo.permissoes import (
    MODULOS, NOMES_ACOES, PERFIS, ler_permissoes, perfil_de, pode, sanitizar_permissoes,
)
from nucleo.senha import validar_senha
from propostas.regras.documentos import email_valido

ACOES_MATRIZ = ["ver", "criar", "editar", "excluir"]


# ---- Escopo (quem pode ver e gerenciar quem) ---------------------------------------
# Correção em relação ao Next: lá o admin de uma empresa conseguia ver, editar, redefinir
# a senha e excluir usuários de qualquer empresa (busca só pelo id).

def _visiveis(request):
    """Usuários que eu enxergo: superadmin vê todos; os demais, quem compartilha empresa comigo.
    Usuários de "todas as empresas" só aparecem para quem também tem esse acesso."""
    eu = request.usuario
    if eu.super_admin:
        return Usuario.objects.all()
    minhas = [e.id for e in request.empresas]
    q = Q(id__in=Membro.objects.filter(empresa_id__in=minhas).values("usuario_id"), todas_empresas=False, super_admin=False)
    if eu.todas_empresas:
        q |= Q(todas_empresas=True, super_admin=False)
    return Usuario.objects.filter(q | Q(id=eu.id))


def _permissoes_contidas(alvo, eu) -> bool:
    """Permissões do alvo ⊆ minhas (não posso assumir a conta de quem tem mais poder)."""
    dele, meu = ler_permissoes(alvo.permissoes), ler_permissoes(eu.permissoes)
    for m, acoes in dele["modulos"].items():
        for a, v in (acoes or {}).items():
            if v and not (meu["modulos"].get(m) or {}).get(a):
                return False
    return not (dele["propostasDeTodos"] and not meu["propostasDeTodos"])


def _alvo_gerenciavel(request, uid):
    """O usuário-alvo, se eu posso gerenciá-lo; senão None."""
    eu = request.usuario
    alvo = _visiveis(request).filter(id=uid).first()
    if alvo is None:
        return None
    if eu.super_admin or alvo.id == eu.id:
        return alvo
    if alvo.super_admin or not _permissoes_contidas(alvo, eu):
        return None
    # Quem também está em empresa que eu não administro fica só para ver: trocar senha, e-mail ou
    # permissões daria acesso às propostas daquela empresa.
    minhas = {e.id for e in request.empresas}
    if not eu.todas_empresas and alvo.membros.exclude(empresa_id__in=minhas).exists():
        return None
    return alvo


# ---- Lista ------------------------------------------------------------------------

@exige_sessao("usuarios")
def usuarios(request):
    eu = request.usuario
    lista = list(_visiveis(request).order_by("-ativo", "nome"))
    nomes = {}
    for m in Membro.objects.filter(usuario__in=lista).select_related("empresa").order_by("id"):
        nomes.setdefault(m.usuario_id, []).append(m.empresa.nome)
    agora = timezone.now()
    for u in lista:
        u.perfil = perfil_de(u)
        u.empresas_txt = "Todas" if u.super_admin or u.todas_empresas else ", ".join(nomes.get(u.id, []))
        u.situacao = ("Bloqueado" if u.bloqueado_ate and u.bloqueado_ate > agora else "Ativo") if u.ativo else "Inativo"
    return render(request, "painel/cadastros/usuarios.html", {
        "lista": lista,
        "pode_criar": pode(eu, "usuarios", "criar"),
    })


# ---- Tela do usuário ----------------------------------------------------------------

def _matriz(permissoes: dict) -> list[dict]:
    linhas = []
    for m, info in MODULOS.items():
        marcadas = permissoes["modulos"].get(m) or {}
        linhas.append({
            "nome": info["nome"],
            "celulas": [
                {"existe": a in info["acoes"], "marcado": bool(marcadas.get(a)), "rotulo": f"{info['nome']}: {NOMES_ACOES[a]}"}
                for a in ACOES_MATRIZ
            ],
        })
    return linhas


def usuario(request, uid):
    novo = uid == "novo"
    return (_usuario_novo if novo else _usuario_existente)(request, uid)


def _tela_usuario(request, uid):
    eu = request.usuario
    novo = uid == "novo"
    alvo = None if novo else _visiveis(request).filter(id=uid).first()
    if not novo and alvo is None:
        raise Http404
    todas = list(Empresa.objects.order_by("nome").values("id", "nome"))
    meus = {e.id for e in request.empresas}
    visiveis = todas if eu.super_admin else [e for e in todas if e["id"] in meus]
    if alvo:
        inicial = {
            "id": alvo.id, "nome": alvo.nome, "email": alvo.email, "whatsapp": alvo.whatsapp or "", "ativo": alvo.ativo,
            "superAdmin": alvo.super_admin, "todasEmpresas": alvo.todas_empresas,
            "empresas": list(alvo.membros.order_by("id").values_list("empresa_id", flat=True)),
            "permissoes": ler_permissoes(alvo.permissoes),
        }
    else:
        inicial = {
            "nome": "", "email": "", "whatsapp": "", "ativo": True, "superAdmin": False, "todasEmpresas": False,
            "empresas": [request.empresa.id], "permissoes": copy.deepcopy(PERFIS["vendedor"]["permissoes"]),
        }
    perfis = [{"id": k, "nome": p["nome"], "descricao": p["descricao"], "permissoes": p["permissoes"]} for k, p in PERFIS.items()]
    dados = {
        "inicial": inicial,
        "empresas": visiveis,
        "euSuper": eu.super_admin,
        "euTodas": eu.todas_empresas,
        "modulos": [{"id": m, "nome": i["nome"], "acoes": i["acoes"]} for m, i in MODULOS.items()],
        "acoes": [{"id": a, "nome": NOMES_ACOES[a]} for a in ACOES_MATRIZ],
        "perfis": perfis,
    }
    return render(request, "painel/cadastros/usuario.html", {
        "novo": novo,
        "alvo": alvo,
        "u": inicial,
        "empresas_form": [{**e, "marcada": e["id"] in inicial["empresas"]} for e in visiveis],
        "eu_super": eu.super_admin,
        "eu_todas": eu.todas_empresas,
        "perfis": perfis,
        "matriz": _matriz(inicial["permissoes"]),
        "acoes_matriz": [NOMES_ACOES[a] for a in ACOES_MATRIZ],
        "pode_excluir": not novo and pode(eu, "usuarios", "excluir") and alvo.id != eu.id,
        "dados": dados,
    })


_usuario_novo = exige_sessao("usuarios", "criar")(_tela_usuario)
_usuario_existente = exige_sessao("usuarios", "ver")(_tela_usuario)


# ---- Ações -----------------------------------------------------------------------------

def _limitar_ao_concedente(p: dict, concedente: Usuario) -> dict:
    """Quem não é superadmin não pode conceder o que não tem."""
    if concedente.super_admin:
        return p
    meu = ler_permissoes(concedente.permissoes)
    modulos = {}
    for m in MODULOS:
        acoes = {a: v for a, v in (p["modulos"].get(m) or {}).items() if v and (meu["modulos"].get(m) or {}).get(a)}
        if acoes:
            modulos[m] = acoes
    return {"modulos": modulos, "propostasDeTodos": bool(p.get("propostasDeTodos")) and bool(meu["propostasDeTodos"])}


def _texto(v) -> str:
    return v if isinstance(v, str) else ("" if v is None else str(v))


def _senha_provisoria(sufixo: str) -> str:
    # randomBytes(6).toString("base64url") + sufixo (8 caracteres + 2)
    return secrets.token_urlsafe(6) + sufixo


@require_POST
def salvar(request):
    if request.usuario is None:
        return JsonResponse({"erro": SEM_PERMISSAO}, status=403)
    try:
        d = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        d = None
    if not isinstance(d, dict):
        return JsonResponse({"erro": "Dados inválidos."}, status=400)
    return (_salvar_editar if d.get("id") else _salvar_criar)(request, d)


def _salvar(request, d: dict):
    eu = request.usuario
    nome = _texto(d.get("nome")).strip()[:120]
    email = _texto(d.get("email")).strip().lower()
    if not nome:
        return JsonResponse({"erro": "Informe o nome."})
    if not email_valido(email) or len(email) > 160:
        return JsonResponse({"erro": "E-mail inválido."})

    uid = _texto(d.get("id")) or None
    existente = Usuario.objects.filter(id=uid).first() if uid else None
    if uid and existente is None:
        return JsonResponse({"erro": "Usuário não encontrado."})
    if existente and existente.super_admin and not eu.super_admin:
        return JsonResponse({"erro": "Apenas um superadministrador pode alterar outro superadministrador."})
    alvo = _alvo_gerenciavel(request, uid) if uid else None
    if uid and alvo is None:
        return JsonResponse({"erro": "Sem permissão para este usuário."})
    if alvo and alvo.id == eu.id and (not d.get("ativo") or (eu.super_admin and not d.get("superAdmin"))):
        return JsonResponse({"erro": "Você não pode desativar nem rebaixar o próprio acesso."})
    if alvo and alvo.id == eu.id and d.get("senha"):
        return JsonResponse({"erro": "Para trocar a própria senha, use Minha conta (pede a senha atual)."})
    if Usuario.objects.filter(email=email).exclude(id=uid).exists():
        return JsonResponse({"erro": "Já existe um usuário com este e-mail."})

    # Empresas que quem está editando pode conceder
    minhas = {e.id for e in request.empresas}
    pedidas = [x for x in (d.get("empresas") or []) if isinstance(x, str)] if isinstance(d.get("empresas"), list) else []
    existentes = set(Empresa.objects.filter(id__in=pedidas).values_list("id", flat=True))
    empresas = [x for x in pedidas if x in existentes and (eu.super_admin or x in minhas)]
    # Se não sou super, preservo vínculos do alvo com empresas que eu não enxergo
    preservar = (
        [x for x in alvo.membros.order_by("id").values_list("empresa_id", flat=True) if x not in minhas]
        if alvo and not eu.super_admin else []
    )
    super_admin = bool(d.get("superAdmin")) if eu.super_admin else bool(alvo and alvo.super_admin)
    todas_empresas = bool(d.get("todasEmpresas")) if eu.super_admin or eu.todas_empresas else bool(alvo and alvo.todas_empresas)
    if not super_admin and not todas_empresas and len(empresas) + len(preservar) == 0:
        return JsonResponse({"erro": "Escolha pelo menos uma empresa."})
    entrada = d.get("permissoes") if isinstance(d.get("permissoes"), dict) else {"modulos": {}}
    if not isinstance(entrada.get("modulos"), dict):
        entrada = {**entrada, "modulos": {}}
    entrada = {**entrada, "modulos": {k: v for k, v in entrada["modulos"].items() if isinstance(v, dict)}}
    permissoes = _limitar_ao_concedente(sanitizar_permissoes(entrada), eu)

    senha = d.get("senha")
    senha_temporaria = None
    nova_senha = None
    if senha:
        problema = validar_senha(_texto(senha))
        if problema:
            return JsonResponse({"erro": problema})
        nova_senha = _texto(senha)
    elif alvo is None:
        senha_temporaria = _senha_provisoria("9a")
        nova_senha = senha_temporaria

    whatsapp = re.sub(r"[^\d+]", "", _texto(d.get("whatsapp")), flags=re.ASCII)[:16] or None
    ativo = bool(d.get("ativo"))
    with transaction.atomic():
        if alvo:
            # Mudança de acesso encerra as sessões abertas do usuário. (O Next compara o JSON
            # textual, que difere pela ordem das chaves; aqui a comparação é pelo conteúdo.)
            mudou_acesso = (
                alvo.ativo != ativo or nova_senha is not None
                or json.dumps(alvo.permissoes, sort_keys=True) != json.dumps(permissoes, sort_keys=True)
            )
            u = alvo
        else:
            mudou_acesso = False
            u = Usuario(email=email)
        u.nome, u.email, u.whatsapp, u.ativo = nome, email, whatsapp, ativo
        u.super_admin, u.todas_empresas, u.permissoes = super_admin, todas_empresas, permissoes
        if nova_senha is not None:
            u.set_password(nova_senha)
            u.trocar_senha = True
        u.save()
        if mudou_acesso:
            Usuario.objects.filter(pk=u.pk).update(versao_sessao=F("versao_sessao") + 1)
        Membro.objects.filter(usuario=u).delete()
        vinculos = list(dict.fromkeys([*empresas, *preservar]))
        Membro.objects.bulk_create([Membro(usuario=u, empresa_id=e) for e in vinculos])

    auditar(request, usuario=eu, empresa_id=request.empresa.id, acao="EDITAR" if alvo else "CRIAR",
            entidade="Usuario", entidade_id=u.id,
            descricao=f"{email}{' (senha definida)' if nova_senha is not None else ''}")
    r = {"ok": True, "id": u.id}
    if senha_temporaria:
        r["senhaTemporaria"] = senha_temporaria
    return JsonResponse(r)


_salvar_criar = exige_acao("usuarios", "criar")(_salvar)
_salvar_editar = exige_acao("usuarios", "editar")(_salvar)


@require_POST
@exige_acao("usuarios", "editar")
def redefinir_senha(request, uid):
    alvo = _alvo_gerenciavel(request, uid)
    if alvo is None:
        return JsonResponse({"erro": "Sem permissão para este usuário."})
    if alvo.super_admin and not request.usuario.super_admin:
        return JsonResponse({"erro": "Sem permissão para este usuário."})
    senha = _senha_provisoria("7b")
    alvo.set_password(senha)
    alvo.trocar_senha = True
    alvo.falhas_login = 0
    alvo.bloqueado_ate = None
    alvo.save(update_fields=["password", "trocar_senha", "falhas_login", "bloqueado_ate", "atualizado_em"])
    Usuario.objects.filter(pk=alvo.pk).update(versao_sessao=F("versao_sessao") + 1)
    auditar(request, usuario=request.usuario, acao="REDEFINIR_SENHA", entidade="Usuario", entidade_id=uid,
            descricao=alvo.email)
    return JsonResponse({"senha": senha})


@require_POST
@exige_sessao("usuarios", "excluir")
def excluir(request, uid):
    eu = request.usuario
    alvo = _alvo_gerenciavel(request, uid)
    if alvo is None or alvo.id == eu.id or (alvo.super_admin and not eu.super_admin):
        return redirect("/admin/usuarios")
    if alvo.propostas.exists():
        # Mantém o histórico das propostas: apenas desativa e encerra as sessões
        Usuario.objects.filter(pk=alvo.pk).update(ativo=False, versao_sessao=F("versao_sessao") + 1)
        auditar(request, usuario=eu, acao="DESATIVAR", entidade="Usuario", entidade_id=uid,
                descricao=f"{alvo.email} (tem propostas)")
    else:
        alvo.delete()
        auditar(request, usuario=eu, acao="EXCLUIR", entidade="Usuario", entidade_id=uid, descricao=alvo.email)
    return redirect("/admin/usuarios")
