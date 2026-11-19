"""Cria propostas de teste a partir dos modelos do seed (sem passar pelo painel)."""

from datetime import datetime

from django.core.management import call_command

from nucleo.models import Empresa, Usuario
from propostas.models import Contato, Modelo, Produto, Proposta
from propostas.regras.campos import valores_padrao
from propostas.regras.precificacao import calcular

_SEQ = [0]


def semear():
    call_command("semear", verbosity=0)


def catalogo_da_empresa(empresa):
    return [
        {"id": p.pk, "categoria": p.categoria, "codigo": p.codigo or p.pk, "nome": p.nome, "descricao": p.descricao,
         "preco": float(p.preco), "atributos": p.atributos}
        for p in Produto.objects.filter(empresa=empresa, ativo=True).order_by("categoria", "ordem")
    ]


def criar_proposta(slug_empresa="caddi", tipo="servidor-nuvem", validade="2099-12-31", status="PUBLICADA",
                   cliente="Grupo Exemplo Ltda", **extra) -> Proposta:
    _SEQ[0] += 1
    empresa = Empresa.objects.get(slug=slug_empresa)
    modelo = Modelo.objects.get(empresa=empresa, tipo_solucao=tipo)
    autor = Usuario.objects.filter(super_admin=True).first()
    dados = valores_padrao(modelo.campos)
    contato = Contato.objects.create(empresa=empresa, organizacao=cliente)
    for c in modelo.campos:
        if c["tipo"] == "contato":
            dados[c["id"]] = {"contatoId": contato.pk, "nome": cliente}
        if c["tipo"] == "data":
            dados[c["id"]] = validade
    catalogo = catalogo_da_empresa(empresa)
    calc = calcular(modelo.precificacao, dados, catalogo)
    return Proposta.objects.create(
        empresa=empresa, modelo=modelo, autor=autor, contato=contato,
        codigo=f"{empresa.prefixo}-2026-{1000 + _SEQ[0]}", slug=f"exemplo-{_SEQ[0]:04d}abcdef12",
        titulo=f"{modelo.nome} — {cliente}", cliente_nome=cliente, dados=dados,
        snapshot={"campos": modelo.campos, "secoes": modelo.secoes, "precificacao": modelo.precificacao,
                  "catalogo": catalogo, "modeloNome": modelo.nome},
        calculo=calc, valor_mensal=calc["totalMensal"], valor_unico=calc["totalUnico"],
        valida_ate=datetime.fromisoformat(f"{validade}T23:59:59-03:00"), status=status, **extra,
    )
