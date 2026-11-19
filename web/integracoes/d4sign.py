"""D4Sign (src/lib/d4sign.ts). Etapa 3: só a configuração; a chamada à API entra na etapa 5."""

from django.conf import settings


def pronto(cfg: dict | None) -> bool:
    """True quando o D4Sign está pronto para a empresa (credenciais no servidor + config da empresa)."""
    cfg = cfg or {}
    return bool(settings.D4SIGN_TOKEN_API and cfg.get("cofre") and cfg.get("template") and cfg.get("signatarioEmail"))


def ambiente() -> str:
    return "produção" if settings.D4SIGN_AMBIENTE == "producao" else "sandbox"


class D4SignIndisponivel(Exception):
    pass


def gerar_contrato(empresa, proposta) -> dict:
    raise D4SignIndisponivel("A geração de contrato no D4Sign entra na etapa 5 da migração.")
