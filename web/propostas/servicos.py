"""Criação e edição de propostas (src/app/admin/propostas/acoes.ts e src/lib/{catalogo,links}.ts)."""

import json
import re
import secrets
from datetime import datetime

from django.conf import settings
from django.db import transaction

from nucleo.auditoria import auditar
from nucleo.formato import slugify_br
from propostas.models import Contato, Evento, Proposta, Produto, StatusProposta
from propostas.numeracao import proximo_codigo
from propostas.regras.campos import data_valida, validar
from propostas.regras.precificacao import calcular, catalogo_do_modelo


def catalogo_da_empresa(empresa) -> list[dict]:
    """Produtos ativos da empresa, no formato usado pelo cálculo (preço em número)."""
    return [
        {"id": p.pk, "categoria": p.categoria, "codigo": p.codigo or p.pk, "nome": p.nome, "descricao": p.descricao,
         "preco": float(p.preco), "atributos": p.atributos or {}}
        for p in Produto.objects.filter(empresa=empresa, ativo=True).order_by("categoria", "ordem")
    ]


def link_publico(dominio: str, slug: str) -> str:
    if settings.PUBLIC_BASE_URL:
        return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/p/{slug}"
    return f"{settings.PUBLIC_PROTOCOL}://{dominio}/p/{slug}"


def dados_seguros(campos: list[dict], dados: dict) -> dict:
    """Só campos conhecidos, cada valor com até 20.000 caracteres em JSON."""
    out = {}
    for c in campos:
        if c["id"] not in dados:
            continue
        txt = json.dumps(dados[c["id"]], ensure_ascii=False, separators=(",", ":"))
        if len(txt) > 20000:
            continue
        out[c["id"]] = json.loads(txt)
    return out


def resolver_contato(empresa, campos: list[dict], dados: dict):
    """Reaproveita o contato (pelo id ou pelo nome) ou cadastra um novo."""
    campo = next((c for c in campos if c["tipo"] == "contato"), None)
    if campo is None:
        return dados, "Cliente", None
    v = dados.get(campo["id"]) if isinstance(dados.get(campo["id"]), dict) else {"nome": ""}
    cliente = str(v.get("nome") or "").strip()[:160] or "Cliente"
    existente = None
    if v.get("contatoId"):
        existente = Contato.objects.filter(pk=str(v["contatoId"]), empresa=empresa).first()
    else:
        existente = Contato.objects.filter(empresa=empresa, organizacao__iexact=cliente).first()
    contato = existente or Contato.objects.create(empresa=empresa, organizacao=cliente)
    return {**dados, campo["id"]: {"nome": cliente, "contatoId": contato.pk}}, cliente, contato


def validade(campos: list[dict], dados: dict):
    c = next((x for x in campos if x["tipo"] == "data"), None)
    v = str(dados.get(c["id"]) or "") if c else ""
    return datetime.fromisoformat(f"{v}T23:59:59-03:00") if data_valida(v) else None


def criar_proposta(request, modelo, dados_brutos: dict) -> dict:
    campos, precificacao = modelo.campos, modelo.precificacao
    erros = validar(campos, dados_brutos)
    if erros:
        return {"erros": erros}
    empresa, usuario = request.empresa, request.usuario
    with transaction.atomic():
        dados, cliente, contato = resolver_contato(empresa, campos, dados_seguros(campos, dados_brutos))
        catalogo = catalogo_do_modelo(campos, catalogo_da_empresa(empresa))
        calc = calcular(precificacao, dados, catalogo)
        slug = f"{slugify_br(cliente)}-{secrets.token_hex(6)}"
        codigo = proximo_codigo(empresa)
        p = Proposta.objects.create(
            empresa=empresa, codigo=codigo, modelo=modelo, autor=usuario, contato=contato, slug=slug,
            titulo=f"{modelo.nome} — {cliente}", cliente_nome=cliente, dados=dados,
            # Congela o modelo e os preços do catálogo usados nesta proposta
            snapshot={"campos": campos, "secoes": modelo.secoes, "precificacao": precificacao, "catalogo": catalogo,
                      "modeloNome": modelo.nome},
            calculo=calc, valor_mensal=calc["totalMensal"], valor_unico=calc["totalUnico"],
            valida_ate=validade(campos, dados), desconto_acima_limite=calc["desconto"]["acimaLimite"],
        )
        Evento.objects.create(proposta=p, tipo="CRIADA", dados={"nome": usuario.nome})
    auditar(request, usuario=usuario, empresa_id=empresa.pk, acao="CRIAR", entidade="Proposta", entidade_id=p.pk,
            descricao=f"{codigo} {cliente}")
    return {"id": p.pk, "link": link_publico(empresa.dominio_propostas, slug), "codigo": codigo}


def editar_proposta(request, p: Proposta, dados_brutos: dict) -> dict:
    """Edita uma proposta já enviada (o link continua o mesmo)."""
    if p.status == StatusProposta.ACEITA:
        return {"erros": ["Proposta já aceita: não pode ser alterada. Duplique para criar uma nova versão."]}
    snap = p.snapshot or {}
    campos = snap.get("campos") or []
    erros = validar(campos, dados_brutos)
    if erros:
        return {"erros": erros}
    empresa, usuario = request.empresa, request.usuario
    with transaction.atomic():
        # Trava a linha e confere de novo: o cliente pode ter aceitado enquanto o vendedor editava
        atual = Proposta.objects.select_for_update().filter(pk=p.pk).values_list("status", flat=True).first()
        if atual is None or atual == StatusProposta.ACEITA:
            return {"erros": ["Proposta já aceita: não pode ser alterada. Duplique para criar uma nova versão."]}
        dados, cliente, contato = resolver_contato(empresa, campos, dados_seguros(campos, dados_brutos))
        catalogo = catalogo_do_modelo(campos, catalogo_da_empresa(empresa))
        calc = calcular(snap.get("precificacao") or {}, dados, catalogo)
        # Ao editar, a proposta volta a valer (reabre se tinha expirado ou sido recusada)
        Proposta.objects.filter(pk=p.pk).update(
            dados=dados, cliente_nome=cliente, contato=contato, snapshot={**snap, "catalogo": catalogo}, calculo=calc,
            valor_mensal=calc["totalMensal"], valor_unico=calc["totalUnico"], valida_ate=validade(campos, dados),
            desconto_acima_limite=calc["desconto"]["acimaLimite"],
            status=StatusProposta.ABERTA if p.primeira_abertura_em else StatusProposta.PUBLICADA,
            decidida_em=None, decisao_nome=None, motivo_recusa=None, comentario_decisao=None,
        )
        Evento.objects.create(proposta=p, tipo="EDITADA", dados={"nome": usuario.nome})
    auditar(request, usuario=usuario, empresa_id=empresa.pk, acao="EDITAR", entidade="Proposta", entidade_id=p.pk,
            descricao=p.codigo)
    return {"id": p.pk, "link": link_publico(empresa.dominio_propostas, p.slug), "codigo": p.codigo}
