"""Clientes e catálogo (src/app/admin/{contatos,catalogo}/page.tsx e cadastros.ts).

As server actions do Next viram POST comum: o formulário volta para a mesma URL
e a página é renderizada de novo com a mensagem (como o FormAcao). Cadastro novo
com sucesso limpa o formulário; edição com sucesso volta para a lista.
"""

import math
import re
from decimal import ROUND_HALF_UP, Decimal

from django.db.models import Count, Q
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from nucleo.auditoria import auditar
from nucleo.auth import SEM_PERMISSAO, exige_sessao, pode_agir
from nucleo.permissoes import pode
from propostas.models import Contato, Produto
from propostas.regras.documentos import cnpj_valido, email_valido, formatar_cnpj

# ---- Utilidades comuns aos cadastros ----------------------------------------------

_NUM_JS = re.compile(r"[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?", re.ASCII)
_INT_MAX = 2**31 - 1


def txt(dados, chave: str, maximo: int = 300) -> str:
    """String(f.get(k) ?? "").trim().slice(0, max)"""
    return str(dados.get(chave, "") or "").strip()[:maximo]


def numero_js(s: str) -> float:
    """Number(s) do JavaScript (decimal, hexa/octal/binário, Infinity); inválido = NaN."""
    s = s.strip()
    if s == "":
        return 0.0
    if _NUM_JS.fullmatch(s):
        return float(s)
    m = re.fullmatch(r"0([xob])([0-9a-f]+)", s, re.I | re.ASCII)
    if m:
        try:
            return float(int(m.group(2), {"x": 16, "o": 8, "b": 2}[m.group(1).lower()]))
        except ValueError:
            return math.nan
    if s in ("Infinity", "+Infinity"):
        return math.inf
    if s == "-Infinity":
        return -math.inf
    return math.nan


def numero_texto(v) -> str:
    """String(Number(v)) para números do JSON/Decimal: 92 -> "92", 1.5 -> "1.5"."""
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float, Decimal)):
        d = Decimal(str(v))
        if d == d.to_integral_value():
            return str(int(d))
        return format(d.normalize(), "f")
    return str(v)


def com_query(caminho: str, request) -> str:
    q = request.META.get("QUERY_STRING", "")
    return f"{caminho}?{q}" if q else caminho


# ---- Produtos ---------------------------------------------------------------------

_CHAVE_ATRIBUTO = re.compile(r"[a-zA-Z]\w{0,30}", re.ASCII)
_CODIGO = re.compile(r"[\w-]+", re.ASCII)


def ler_atributos(s: str) -> dict:
    atributos = {}
    for par in re.split(r"[;\n]", s):
        partes = [x.strip() for x in par.split("=")]
        k = partes[0] if partes else ""
        v = partes[1] if len(partes) > 1 else ""
        if k and v and _CHAVE_ATRIBUTO.fullmatch(k):
            n = numero_js(v)
            if math.isfinite(n):
                atributos[k] = int(n) if n == int(n) and abs(n) < 2**53 else n
            else:
                atributos[k] = v[:100]
    return atributos


def texto_atributos(p) -> str:
    if p is None:
        return ""
    return "; ".join(f"{k}={numero_texto(v)}" for k, v in (p.atributos or {}).items())


def _valores_produto(p=None) -> dict:
    if p is None:
        return {"nome": None, "categoria": None, "codigo": "", "preco": None, "recorrencia": "MENSAL",
                "descricao": "", "ordem": "0", "atributos": ""}
    return {"nome": p.nome, "categoria": p.categoria, "codigo": p.codigo or "", "preco": numero_texto(p.preco),
            "recorrencia": p.recorrencia, "descricao": p.descricao or "", "ordem": str(p.ordem),
            "atributos": texto_atributos(p)}


def _tela_catalogo(request, editar=None, valores=None, **msg):
    empresa = request.empresa
    produtos = list(Produto.objects.filter(empresa=empresa).order_by("categoria", "ordem", "nome"))
    atual = next((p for p in produtos if p.id == editar), None) if editar else None
    u = request.usuario
    pode_form = pode(u, "catalogo", "editar") if atual else pode(u, "catalogo", "criar")
    for p in produtos:
        p.attrs = texto_atributos(p)
    return render(request, "painel/cadastros/catalogo.html", {
        "produtos": produtos,
        "editar": editar,
        "atual": atual,
        "pode_form": pode_form,
        "pode_editar": pode(u, "catalogo", "editar"),
        "pode_excluir": pode(u, "catalogo", "excluir"),
        "v": valores if valores is not None else _valores_produto(atual),
        **msg,
    })


@exige_sessao("catalogo")
def catalogo(request):
    if request.method != "POST":
        return _tela_catalogo(request, editar=request.GET.get("editar"))
    f = request.POST
    pid = txt(f, "id", 40)
    digitado = {k: txt(f, k, 1000) for k in ("nome", "categoria", "codigo", "preco", "recorrencia", "descricao",
                                                "ordem", "atributos")}

    def erro(msg):
        return _tela_catalogo(request, editar=pid or None, valores=digitado, erro=msg)

    if not pode_agir(request, "catalogo", "editar" if pid else "criar"):
        return erro(SEM_PERMISSAO)
    preco = numero_js(txt(f, "preco").replace(",", ".", 1))
    # Teto do campo decimal(12,2): no Next um preço maior estouraria no banco
    if not txt(f, "nome") or not txt(f, "categoria") or not math.isfinite(preco) or preco < 0 or preco >= 1e10:
        return erro("Preencha nome, categoria e preço.")
    codigo = txt(f, "codigo", 60) or None
    if codigo and not _CODIGO.fullmatch(codigo):
        return erro("O código deve ter só letras, números, - ou _.")
    empresa = request.empresa
    if codigo and Produto.objects.filter(empresa=empresa, codigo=codigo).exclude(id=pid or None).exists():
        return erro("Já existe um produto com este código.")
    ordem = numero_js(txt(f, "ordem"))
    ordem = math.floor(ordem + 0.5) if math.isfinite(ordem) and ordem else 0
    dados = {
        "nome": txt(f, "nome", 120),
        "codigo": codigo,
        "categoria": txt(f, "categoria", 60),
        "descricao": txt(f, "descricao") or None,
        "preco": Decimal(repr(preco)).quantize(Decimal("0.01"), ROUND_HALF_UP),
        "recorrencia": "UNICO" if txt(f, "recorrencia") == "UNICO" else "MENSAL",
        "atributos": ler_atributos(txt(f, "atributos", 1000)),
        "ordem": max(-_INT_MAX - 1, min(_INT_MAX, ordem)),
    }
    if pid:
        if not Produto.objects.filter(id=pid, empresa=empresa).update(**dados):
            return erro("Produto não encontrado.")
    else:
        Produto.objects.create(empresa=empresa, **dados)
    auditar(request, usuario=request.usuario, empresa_id=empresa.id, acao="EDITAR" if pid else "CRIAR",
            entidade="Produto", entidade_id=pid or None, descricao=dados["nome"])
    if pid:
        return redirect("/admin/catalogo")
    return _tela_catalogo(request, ok="Produto cadastrado.")


@require_POST
@exige_sessao("catalogo", "editar")
def alternar_produto(request, pid):
    p = Produto.objects.filter(id=pid, empresa=request.empresa).first()
    if p:
        p.ativo = not p.ativo
        p.save(update_fields=["ativo"])
    return redirect(com_query("/admin/catalogo", request))


@require_POST
@exige_sessao("catalogo", "excluir")
def excluir_produto(request, pid):
    # Propostas guardam cópia do catálogo: excluir não afeta as já enviadas
    apagados, _ = Produto.objects.filter(id=pid, empresa=request.empresa).delete()
    if apagados:
        auditar(request, usuario=request.usuario, empresa_id=request.empresa.id, acao="EXCLUIR",
                entidade="Produto", entidade_id=pid)
    return redirect(com_query("/admin/catalogo", request))


# ---- Clientes ---------------------------------------------------------------------

_CAMPOS_CONTATO = ("organizacao", "razaoSocial", "cnpj", "responsavel", "email", "celular")


def _valores_contato(c=None) -> dict:
    if c is None:
        return {"organizacao": None, "razaoSocial": "", "cnpj": "", "responsavel": "", "email": "", "celular": ""}
    return {"organizacao": c.organizacao, "razaoSocial": c.razao_social or "", "cnpj": c.cnpj or "",
            "responsavel": c.responsavel or "", "email": c.email or "", "celular": c.celular or ""}


def _tela_contatos(request, editar=None, valores=None, **msg):
    empresa = request.empresa
    busca = (request.GET.get("q") or "").strip()[:80]
    filtro = Q(empresa=empresa, ativo=True)
    if busca:
        filtro &= Q(organizacao__icontains=busca) | Q(cnpj__contains=busca) | Q(responsavel__icontains=busca)
    contatos = Contato.objects.filter(filtro).annotate(n_propostas=Count("propostas")).order_by("organizacao")
    atual = Contato.objects.filter(id=editar, empresa=empresa).first() if editar else None
    u = request.usuario
    pode_form = pode(u, "clientes", "editar") if atual else pode(u, "clientes", "criar")
    return render(request, "painel/cadastros/contatos.html", {
        "contatos": contatos,
        "busca": busca,
        "editar": editar,
        "atual": atual,
        "pode_form": pode_form,
        "pode_editar": pode(u, "clientes", "editar"),
        "pode_excluir": pode(u, "clientes", "excluir"),
        "v": valores if valores is not None else _valores_contato(atual),
        **msg,
    })


@exige_sessao("clientes")
def contatos(request):
    if request.method != "POST":
        return _tela_contatos(request, editar=request.GET.get("editar"))
    f = request.POST
    cid = txt(f, "id", 40)
    digitado = {k: txt(f, k, 1000) for k in _CAMPOS_CONTATO}

    def erro(msg):
        return _tela_contatos(request, editar=cid or None, valores=digitado, erro=msg)

    if not pode_agir(request, "clientes", "editar" if cid else "criar"):
        return erro(SEM_PERMISSAO)
    if not txt(f, "organizacao"):
        return erro("Informe a empresa do cliente.")
    email = txt(f, "email", 160)
    if email and not email_valido(email):
        return erro("E-mail inválido.")
    cnpj = txt(f, "cnpj", 20)
    if cnpj and not cnpj_valido(cnpj):
        return erro("CNPJ inválido.")
    dados = {
        "organizacao": txt(f, "organizacao", 160),
        "razao_social": txt(f, "razaoSocial", 200) or None,
        "cnpj": formatar_cnpj(cnpj) if cnpj else None,
        "responsavel": txt(f, "responsavel", 120) or None,
        "email": email or None,
        "celular": txt(f, "celular", 20) or None,
    }
    empresa = request.empresa
    if cid:
        if not Contato.objects.filter(id=cid, empresa=empresa).update(**dados):
            return erro("Cliente não encontrado.")
    else:
        Contato.objects.create(empresa=empresa, **dados)
    auditar(request, usuario=request.usuario, empresa_id=empresa.id, acao="EDITAR" if cid else "CRIAR",
            entidade="Contato", entidade_id=cid or None, descricao=dados["organizacao"])
    if cid:
        return redirect("/admin/contatos")
    return _tela_contatos(request, ok="Cliente cadastrado.")


@require_POST
@exige_sessao("clientes", "excluir")
def excluir_contato(request, cid):
    # As propostas mantêm o nome do cliente; só perdem o vínculo com o cadastro
    apagados, _ = Contato.objects.filter(id=cid, empresa=request.empresa).delete()
    if apagados:
        auditar(request, usuario=request.usuario, empresa_id=request.empresa.id, acao="EXCLUIR",
                entidade="Contato", entidade_id=cid)
    return redirect(com_query("/admin/contatos", request))
