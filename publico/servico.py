"""Proposta pelo link público, respeitando o domínio da empresa (src/lib/publico.ts)."""

from django.conf import settings
from django.utils import timezone

from nucleo.tema import tema_de
from propostas.models import Proposta, StatusProposta
from propostas.regras.contexto import montar_contexto

MOTIVOS_PADRAO = ["Desisti do projeto", "Não enxerguei valor", "Preço acima do esperado",
                  "Não foi aprovado pela diretoria", "Escolhi outro fornecedor", "Outro motivo"]


def host_atual(request) -> str:
    bruto = request.META.get("HTTP_X_FORWARDED_HOST") or request.META.get("HTTP_HOST") or ""
    return bruto.split(",")[0].strip().split(":")[0].lower()


def host_permitido(host: str, dominio_empresa: str) -> bool:
    """Em produção a proposta só abre no domínio de propostas da própria empresa."""
    if settings.ALLOW_ANY_HOST:
        return True
    return host == dominio_empresa.lower()


def buscar(request, slug: str, exigir_empresa_ativa: bool = True) -> Proposta | None:
    p = Proposta.objects.select_related("empresa", "autor").filter(slug=slug).first()
    if p is None or p.status == StatusProposta.RASCUNHO:
        return None
    if exigir_empresa_ativa and not p.empresa.ativo:
        return None
    if not host_permitido(host_atual(request), p.empresa.dominio_propostas):
        return None
    return p


def proposta_publica(request, slug: str) -> Proposta | None:
    p = buscar(request, slug)
    if p is None:
        return None
    # Expiração "preguiçosa": marca como expirada no primeiro acesso após a validade
    if p.valida_ate and p.valida_ate < timezone.now() and p.status in (StatusProposta.PUBLICADA, StatusProposta.ABERTA):
        Proposta.objects.filter(pk=p.pk).update(status=StatusProposta.EXPIRADA)
        p.status = StatusProposta.EXPIRADA
    return p


def contexto_da_proposta(p: Proposta) -> dict:
    snap = p.snapshot or {}
    e = p.empresa
    return montar_contexto(
        snap.get("campos") or [], snap.get("precificacao") or {}, p.dados or {}, snap.get("catalogo") or [],
        {"nome": e.razao_social or e.nome, "site": e.site, "rodape": e.rodape},
    )


def tema_da_empresa(empresa) -> dict:
    return tema_de(empresa.tema)


def motivos_da_empresa(empresa) -> list[str]:
    return list(empresa.motivos_recusa or []) or MOTIVOS_PADRAO
