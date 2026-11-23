"""CNPJ, telefone e e-mail: validação e formatação (src/lib/documentos.ts)."""

import re


def so_digitos(s) -> str:
    return re.sub(r"\D", "", s or "", flags=re.ASCII)  # só 0-9, como o \D do JS


def cnpj_valido(v: str) -> bool:
    c = so_digitos(v)
    if len(c) != 14 or re.fullmatch(r"(\d)\1{13}", c):
        return False

    def dv(base: str) -> int:
        pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] if len(base) == 12 else [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        r = sum(int(d) * p for d, p in zip(base, pesos)) % 11
        return 0 if r < 2 else 11 - r

    d1 = dv(c[:12])
    d2 = dv(c[:12] + str(d1))
    return c.endswith(f"{d1}{d2}")


def formatar_cnpj(v: str) -> str:
    c = so_digitos(v)[:14]
    c = re.sub(r"^(\d{2})(\d)", r"\1.\2", c, count=1)
    c = re.sub(r"^(\d{2})\.(\d{3})(\d)", r"\1.\2.\3", c, count=1)
    c = re.sub(r"\.(\d{3})(\d)", r".\1/\2", c, count=1)
    return re.sub(r"(\d{4})(\d)", r"\1-\2", c, count=1)


def _sem_ddi(v: str) -> str:
    return re.sub(r"^55(?=\d{10,11}$)", "", so_digitos(v))


def telefone_valido(v: str) -> bool:
    """Celular/telefone BR: 10-11 dígitos (ou 12-13 com 55)."""
    return len(_sem_ddi(v)) in (10, 11)


def formatar_telefone(v: str) -> str:
    d = _sem_ddi(v)[:11]
    d1 = re.sub(r"^(\d{2})(\d)", r"(\1) \2", d, count=1)
    if len(d) <= 10:
        return re.sub(r"(\d{4})(\d)", r"\1-\2", d1, count=1)
    return re.sub(r"(\d{5})(\d)", r"\1-\2", d1, count=1)


def whatsapp_internacional(v: str) -> str:
    """Número no formato do WhatsApp: 5511999998888."""
    d = so_digitos(v)
    return d if d.startswith("55") and len(d) >= 12 else f"55{d}"


def email_valido(v: str) -> bool:
    return bool(re.fullmatch(r"[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}", (v or "").strip(), re.I))
