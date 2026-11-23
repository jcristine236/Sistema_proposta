"""Política de senha (src/lib/senha.ts): mínimo 10 caracteres, com letra e número."""

import re


def validar_senha(s: str) -> str | None:
    """Devolve a mensagem do problema ou None se a senha é aceitável."""
    if len(s) < 10:
        return "A senha precisa ter pelo menos 10 caracteres."
    if len(s) > 200:
        return "Senha longa demais."
    if not re.search(r"[a-zA-Z]", s) or not re.search(r"\d", s):
        return "A senha precisa ter letras e números."
    if re.fullmatch(r"(.)\1+", s):
        return "Senha fraca demais."
    return None
