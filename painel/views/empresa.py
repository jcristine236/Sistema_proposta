"""Empresa ativa (marca e avisos) e empresas da plataforma (src/app/admin/empresa[s]/page.tsx)."""

import re

from django.db.models import Count, Q
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from nucleo.auditoria import auditar
from nucleo.auth import SEM_PERMISSAO, empresas_do_usuario, exige_sessao, pode_agir
from nucleo.models import Empresa
from nucleo.permissoes import pode
from nucleo.tema import CORES_TEMA, tema_de
from painel.views.cadastros import com_query, txt
from propostas.regras.documentos import email_valido
from propostas.regras.urls import url_imagem

CORES = [
    ("primaria", "Principal", "fundos escuros e títulos"),
    ("primaria2", "Principal 2", "degradês"),
    ("destaque", "Destaque", "botões e valores"),
    ("destaqueSuave", "Destaque suave", "fundos claros"),
    ("destaqueTexto", "Destaque texto", "textos sobre fundo claro"),
    ("neutra", "Neutra", "textos de apoio"),
    ("tinta", "Fundo alternado", "seções intercaladas"),
]
_COR = re.compile(r"#[0-9a-f]{6}", re.I)
# ([\w.]+) e \s como no JS: \w só ASCII
_CAMPO_D4 = re.compile(r"^\s*([A-Za-z0-9_.]+)\s*[:=]\s*(.+?)\s*$")


def _recarregar_empresas(request):
    """Depois de salvar, a lateral e o tema refletem o banco (como o revalidatePath)."""
    request.empresas = empresas_do_usuario(request.usuario)
    slug = request.empresa.slug
    request.empresa = next((e for e in request.empresas if e.slug == slug), request.empresas[0] if request.empresas else request.empresa)


# ---- Empresa ativa ------------------------------------------------------------------

def _valores_empresa(e) -> dict:
    tema = tema_de(e.tema)
    d4 = e.d4sign if isinstance(e.d4sign, dict) else {}
    campos = d4.get("campos") if isinstance(d4.get("campos"), dict) else {}
    return {
        "razaoSocial": e.razao_social or "", "site": e.site or "", "rodape": e.rodape or "",
        "emailNotificacao": e.email_notificacao or "", "whatsappNotificacao": e.whatsapp_notificacao or "",
        "logo": tema.get("logo") or "", "logoClaro": tema.get("logoClaro") or "",
        "d4signCofre": d4.get("cofre") or "", "d4signTemplate": d4.get("template") or "",
        "d4signSignatarioNome": d4.get("signatarioNome") or "", "d4signSignatarioEmail": d4.get("signatarioEmail") or "",
        "d4signCampos": "\n".join(f"{k}: {v}" for k, v in campos.items()),
        "motivosRecusa": "\n".join(str(m) for m in (e.motivos_recusa or [])),
        **{k: tema[k] for k in CORES_TEMA},
    }


def _tela_empresa(request, valores=None, **msg):
    e = request.empresa
    tema = tema_de(e.tema)
    v = valores if valores is not None else _valores_empresa(e)
    return render(request, "painel/cadastros/empresa.html", {
        "e": e,
        "t": tema,
        "v": v,
        "cores": [{"k": k, "r": r, "a": a, "valor": v.get(k, tema[k])} for k, r, a in CORES],
        "logo_preview": tema.get("logoClaro") or tema.get("logo") or "",
        "host": e.dominio_propostas,
        "host_nome": e.dominio_propostas.split(".")[0],
        "pode_editar": pode(request.usuario, "empresa", "editar"),
        **msg,
    })


_CAMPOS_EMPRESA = ("razaoSocial", "site", "rodape", "emailNotificacao", "whatsappNotificacao", "logo", "logoClaro",
                   "d4signCofre", "d4signTemplate", "d4signSignatarioNome", "d4signSignatarioEmail", "d4signCampos",
                   "motivosRecusa", *CORES_TEMA)


@exige_sessao("empresa")
def empresa(request):
    if request.method != "POST":
        return _tela_empresa(request)
    f = request.POST
    digitado = {k: str(f.get(k, "")) for k in _CAMPOS_EMPRESA}
    base = _valores_empresa(request.empresa)
    for k in CORES_TEMA:
        if not _COR.fullmatch(digitado[k]):
            digitado[k] = base[k]

    def erro(msg):
        return _tela_empresa(request, valores=digitado, erro=msg)

    if not pode_agir(request, "empresa", "editar"):
        return erro(SEM_PERMISSAO)
    e = request.empresa
    tema = dict(tema_de(e.tema))
    for k in CORES_TEMA:
        v = txt(f, k, 7)
        if _COR.fullmatch(v):
            tema[k] = v
    for k in ("logo", "logoClaro"):
        v = txt(f, k, 500)
        if v and not url_imagem(v):
            return erro("Endereço de logo inválido.")
        tema[k] = v
    email = txt(f, "emailNotificacao", 160)
    if email and not email_valido(email):
        return erro("E-mail de avisos inválido.")
    motivos = [m.strip()[:100] for m in txt(f, "motivosRecusa", 3000).split("\n")]
    motivos = [m for m in motivos if m][:20]

    # Config do D4Sign (assinatura de contrato)
    d4_email = txt(f, "d4signSignatarioEmail", 160)
    if d4_email and not email_valido(d4_email):
        return erro("E-mail do signatário da empresa (D4Sign) inválido.")
    campos = {}
    for linha in txt(f, "d4signCampos", 2000).split("\n"):
        m = _CAMPO_D4.match(linha)
        if m:
            campos[m.group(1)] = m.group(2)[:80]
    d4 = {
        "cofre": txt(f, "d4signCofre", 80),
        "template": txt(f, "d4signTemplate", 80),
        "signatarioNome": txt(f, "d4signSignatarioNome", 120),
        "signatarioEmail": d4_email,
    }
    d4 = {k: v for k, v in d4.items() if v}
    tem_d4 = bool(d4)
    if campos:
        d4["campos"] = campos

    e.razao_social = txt(f, "razaoSocial", 200) or None
    e.site = txt(f, "site", 120) or None
    e.rodape = txt(f, "rodape", 200) or None
    e.email_notificacao = email or None
    e.whatsapp_notificacao = re.sub(r"\D", "", txt(f, "whatsappNotificacao", 20), flags=re.ASCII) or None
    e.motivos_recusa = motivos
    e.tema = tema
    e.d4sign = d4 if tem_d4 else None
    e.save(update_fields=["razao_social", "site", "rodape", "email_notificacao", "whatsapp_notificacao",
                          "motivos_recusa", "tema", "d4sign", "atualizado_em"])
    auditar(request, usuario=request.usuario, empresa_id=e.id, acao="EDITAR", entidade="Empresa", entidade_id=e.id,
            descricao="marca e avisos")
    _recarregar_empresas(request)
    return _tela_empresa(request, ok="Alterações salvas.")


# ---- Empresas da plataforma (somente superadmin) -------------------------------------

_SLUG = re.compile(r"[a-z0-9-]{2,30}")
_PREFIXO = re.compile(r"[A-Z]{2,5}")
_DOMINIO = re.compile(r"[a-z0-9.-]+\.[a-z]{2,}")
MOTIVOS_PADRAO = ["Preço acima do esperado", "Escolhi outro fornecedor", "Projeto adiado", "Outro motivo"]


def _maximo(n: int) -> str:
    return f"String must contain at most {n} character(s)"


def _validar_empresa(f) -> tuple[dict | None, str | None]:
    """Mesmas regras (e mensagens) do EmpresaZ do Next, na mesma ordem."""
    d = {k: txt(f, k) or None for k in ("id", "nome", "slug", "prefixo", "dominioPropostas", "razaoSocial", "site")}
    if d["id"] and len(d["id"]) > 40:
        return None, _maximo(40)
    if d["nome"] is None:
        return None, "Required"
    if len(d["nome"]) > 80:
        return None, _maximo(80)
    if d["slug"] is None:
        return None, "Required"
    if not _SLUG.fullmatch(d["slug"]):
        return None, "Identificador: letras minúsculas, números e -"
    if d["prefixo"] is None:
        return None, "Required"
    if not _PREFIXO.fullmatch(d["prefixo"]):
        return None, "Prefixo: 2 a 5 letras maiúsculas (ex.: CAD)"
    if d["dominioPropostas"] is None:
        return None, "Required"
    d["dominioPropostas"] = d["dominioPropostas"].lower()
    # O campo do banco tem 200 caracteres
    if not _DOMINIO.fullmatch(d["dominioPropostas"]) or len(d["dominioPropostas"]) > 200:
        return None, "Domínio inválido (ex.: propostas.empresa.com.br)"
    if d["razaoSocial"] and len(d["razaoSocial"]) > 200:
        return None, _maximo(200)
    if d["site"] and len(d["site"]) > 120:
        return None, _maximo(120)
    return d, None


def _valores_plataforma(e=None) -> dict:
    if e is None:
        return {"nome": None, "slug": None, "prefixo": None, "dominioPropostas": None, "razaoSocial": "", "site": ""}
    return {"nome": e.nome, "slug": e.slug, "prefixo": e.prefixo, "dominioPropostas": e.dominio_propostas,
            "razaoSocial": e.razao_social or "", "site": e.site or ""}


def _tela_empresas(request, editar=None, valores=None, **msg):
    empresas = list(Empresa.objects.annotate(n_propostas=Count("propostas")).order_by("nome"))
    atual = next((e for e in empresas if e.id == editar), None) if editar else None
    return render(request, "painel/cadastros/empresas.html", {
        "lista": empresas,
        "atual": atual,
        "v": valores if valores is not None else _valores_plataforma(atual),
        **msg,
    })


@exige_sessao()
def empresas(request):
    if not request.usuario.super_admin:
        return redirect("/admin/sem-permissao")
    if request.method != "POST":
        return _tela_empresas(request, editar=request.GET.get("editar"))
    f = request.POST
    eid = txt(f, "id", 40)
    d, problema = _validar_empresa(f)
    if problema:
        digitado = {k: txt(f, k) for k in ("nome", "slug", "prefixo", "dominioPropostas", "razaoSocial", "site")}
        return _tela_empresas(request, editar=eid or None, valores=digitado, erro=problema)
    conflito = Empresa.objects.filter(
        Q(slug=d["slug"]) | Q(prefixo=d["prefixo"]) | Q(dominio_propostas=d["dominioPropostas"])
    )
    if d["id"]:
        conflito = conflito.exclude(id=d["id"])
    if conflito.exists():
        digitado = {k: txt(f, k) for k in ("nome", "slug", "prefixo", "dominioPropostas", "razaoSocial", "site")}
        return _tela_empresas(request, editar=eid or None, valores=digitado,
                              erro="Identificador, prefixo ou domínio já usado por outra empresa.")
    dados = {"nome": d["nome"], "slug": d["slug"], "prefixo": d["prefixo"], "dominio_propostas": d["dominioPropostas"],
             "razao_social": d["razaoSocial"], "site": d["site"]}
    if d["id"]:
        # No Next, um id inexistente estoura no update (erro 500); aqui vira mensagem
        if not Empresa.objects.filter(id=d["id"]).update(**dados):
            return _tela_empresas(request, erro="Empresa não encontrada.")
        eid = d["id"]
    else:
        eid = Empresa.objects.create(**dados, tema=tema_de({}), motivos_recusa=list(MOTIVOS_PADRAO)).id
    # Obs.: o Next grava "EDITAR" também na criação (d e r.data são o mesmo objeto); aqui fica "CRIAR".
    auditar(request, usuario=request.usuario, empresa_id=eid, acao="EDITAR" if d["id"] else "CRIAR",
            entidade="Empresa", entidade_id=eid, descricao=d["nome"])
    _recarregar_empresas(request)
    return _tela_empresas(request, editar=d["id"], ok="Empresa salva.")


@require_POST
@exige_sessao()
def alternar_empresa(request, eid):
    if request.usuario.super_admin:
        e = Empresa.objects.filter(id=eid).first()
        if e:
            e.ativo = not e.ativo
            e.save(update_fields=["ativo", "atualizado_em"])
            auditar(request, usuario=request.usuario, empresa_id=e.id, acao="ATIVAR" if e.ativo else "DESATIVAR",
                    entidade="Empresa", entidade_id=e.id, descricao=e.nome)
    return redirect(com_query("/admin/empresas", request))
