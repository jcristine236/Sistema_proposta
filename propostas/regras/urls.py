"""Endereços usados nas seções (src/lib/urls.ts): evita javascript:, data: e afins."""

import re
from urllib.parse import parse_qs, quote, urlsplit, urlunsplit

_LOCAL = re.compile(r"^/(uploads|empresas)/[\w./-]+$", re.ASCII)
_MAIL_TEL = re.compile(r"^(mailto:|tel:)[^\s\"'<>]+$", re.I)


def _normalizar(s: str, esquemas: tuple[str, ...]) -> str | None:
    """Equivalente a new URL(s).toString() para os esquemas aceitos."""
    try:
        p = urlsplit(s)
    except ValueError:
        return None
    esquema = p.scheme.lower()
    if esquema not in esquemas or not p.netloc:
        return None
    caminho = quote(p.path or "/", safe="/%:@!$&'()*+,;=-._~")
    consulta = quote(p.query, safe="=&%/:?@!$'()*+,;-._~")
    fragmento = quote(p.fragment, safe="=&%/:?@!$'()*+,;-._~#")
    return urlunsplit((esquema, p.netloc.lower(), caminho, consulta, fragmento))


def url_imagem(u: str | None) -> str | None:
    """Arquivo enviado (/uploads/...), do sistema (/empresas/...) ou https."""
    if not u:
        return None
    s = u.strip()
    if _LOCAL.match(s) and ".." not in s:
        return s
    return _normalizar(s, ("https",))


def url_link(u: str | None) -> str | None:
    """Link de botão: http(s), e-mail ou telefone."""
    if not u:
        return None
    s = u.strip()
    if _MAIL_TEL.match(s):
        return s
    return _normalizar(s, ("https", "http"))


def url_video(u: str | None) -> str | None:
    """Converte links do YouTube/Vimeo no endereço do player incorporado."""
    if not u:
        return None
    try:
        x = urlsplit(u.strip())
    except ValueError:
        return None
    if not x.scheme or not x.netloc:
        return None
    host = re.sub(r"^www\.|^m\.", "", (x.hostname or ""), count=1)
    vid = None
    if host == "youtu.be":
        vid = x.path[1:]
    elif host in ("youtube.com", "youtube-nocookie.com"):
        params = parse_qs(x.query, keep_blank_values=True)
        if "v" in params:
            vid = params["v"][0]
        else:
            m = re.match(r"^/(embed|shorts|live)/([\w-]+)", x.path, re.ASCII)
            vid = m.group(2) if m else None
    if vid is not None and re.fullmatch(r"[\w-]{6,20}", vid, re.ASCII):
        return f"https://www.youtube-nocookie.com/embed/{vid}?rel=0"
    if host in ("vimeo.com", "player.vimeo.com"):
        m = re.search(r"(\d{6,12})", x.path)
        if m:
            return f"https://player.vimeo.com/video/{m.group(1)}"
    return None
