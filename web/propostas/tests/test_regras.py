"""Regras da proposta comparadas com as referências geradas do código Next."""

import json
import math
from datetime import date
from pathlib import Path

from django.test import SimpleTestCase

from propostas.regras.contexto import condicao, js_num, montar_contexto, preencher
from propostas.regras.campos import validar, valores_padrao
from propostas.regras.documentos import cnpj_valido, email_valido, formatar_cnpj, formatar_telefone, telefone_valido
from propostas.regras.precificacao import calcular
from propostas.regras.urls import url_imagem, url_link, url_video

REF = Path(__file__).parent / "referencias"
CASOS = json.loads((REF / "casos.json").read_text(encoding="utf-8"))
EMPRESAS = {e["slug"]: e for e in json.loads((REF / "empresas.json").read_text(encoding="utf-8"))}


def diferenca(a, b, caminho="$"):
    """Primeira diferença entre dois valores JSON (chave ausente == None; floats com tolerância)."""
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            d = diferenca(a.get(k), b.get(k), f"{caminho}.{k}")
            if d:
                return d
        return None
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return f"{caminho}: tamanho {len(a)} != {len(b)}"
        for i, (x, y) in enumerate(zip(a, b)):
            d = diferenca(x, y, f"{caminho}[{i}]")
            if d:
                return d
        return None
    if isinstance(a, bool) or isinstance(b, bool):
        return None if a is b else f"{caminho}: {a!r} != {b!r}"
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return None if math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9) else f"{caminho}: {a!r} != {b!r}"
    return None if a == b else f"{caminho}: {a!r} != {b!r}"


def contexto_do_caso(c):
    e = EMPRESAS[c["empresa"]]
    m = c["modelo"]
    empresa = {"nome": e["razao_social"] or e["nome"], "site": e["site"], "rodape": e["rodape"]}
    return montar_contexto(m["campos"], m["precificacao"], c["dados"], c["catalogo"], empresa)


class ReferenciasTest(SimpleTestCase):
    def test_calcular_igual_ao_ts(self):
        for c in CASOS:
            with self.subTest(c["nome"]):
                obtido = calcular(c["modelo"]["precificacao"], c["dados"], c["catalogo"])
                self.assertIsNone(diferenca(obtido, c["calc"]))

    def test_contexto_igual_ao_ts(self):
        for c in CASOS:
            with self.subTest(c["nome"]):
                ctx = contexto_do_caso(c)
                self.assertIsNone(diferenca(json.loads(json.dumps(ctx)), c["ctx"]))

    def test_preencher_igual_ao_ts(self):
        for c in CASOS:
            ctx = contexto_do_caso(c)
            for texto, esperado in c["preenchidos"]:
                with self.subTest(caso=c["nome"], texto=texto):
                    self.assertEqual(preencher(texto, ctx), esperado)


class RegrasTest(SimpleTestCase):
    def test_documentos(self):
        self.assertTrue(cnpj_valido("11.222.333/0001-81"))
        self.assertFalse(cnpj_valido("11.111.111/1111-11"))
        self.assertEqual(formatar_cnpj("11222333000181"), "11.222.333/0001-81")
        self.assertEqual(formatar_telefone("11912345678"), "(11) 91234-5678")
        self.assertEqual(formatar_telefone("551133334444"), "(11) 3333-4444")
        self.assertTrue(telefone_valido("+55 (11) 91234-5678"))
        self.assertFalse(telefone_valido("1234"))
        self.assertTrue(email_valido(" a@b.com "))
        self.assertFalse(email_valido("a@b"))

    def test_urls(self):
        self.assertEqual(url_video("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0")
        self.assertEqual(url_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0")
        self.assertEqual(url_video("https://vimeo.com/123456789"), "https://player.vimeo.com/video/123456789")
        self.assertIsNone(url_video("https://evil.com/x"))
        self.assertIsNone(url_imagem("javascript:alert(1)"))
        self.assertIsNone(url_imagem("/uploads/../segredo"))
        self.assertEqual(url_imagem("/uploads/abc.png"), "/uploads/abc.png")
        self.assertEqual(url_imagem("https://x.com/a b.png"), "https://x.com/a%20b.png")
        self.assertIsNone(url_link("javascript:alert(1)"))
        self.assertEqual(url_link("https://wa.me/5511"), "https://wa.me/5511")
        self.assertEqual(url_link("mailto:a@b.com"), "mailto:a@b.com")

    def test_valores_padrao_e_validar(self):
        campos = [
            {"id": "cliente", "tipo": "contato", "rotulo": "Cliente", "obrigatorio": True},
            {"id": "validade", "tipo": "data", "rotulo": "Validade", "padraoDias": 15},
            {"id": "plano", "tipo": "produto", "rotulo": "Plano", "categoria": "x", "obrigatorio": True},
            {"id": "sel", "tipo": "selecao", "rotulo": "S", "opcoes": [{"valor": "a", "rotulo": "A"}]},
        ]
        d = valores_padrao(campos, hoje=date(2026, 11, 19))
        self.assertEqual(d["validade"], "2026-12-04")
        self.assertEqual(d["sel"], "a")
        self.assertEqual(validar(campos, d), ['Preencha o campo "Cliente".', 'Preencha o campo "Plano".'])

    def test_condicao_e_js_num(self):
        ctx = {"lista": [], "x": 1, "obj": {"a": ""}}
        self.assertFalse(condicao("lista", ctx))
        self.assertTrue(condicao("!lista", ctx))
        self.assertTrue(condicao("x", ctx))
        self.assertFalse(condicao("obj.a", ctx))
        self.assertTrue(condicao(None, ctx))
        self.assertEqual(js_num(0.1 + 0.2), "0.30000000000000004")
        self.assertEqual(js_num(1e-7), "1e-7")
        self.assertEqual(js_num(1275.75), "1275.75")
        self.assertEqual(js_num(0 * 0.1), "0")
        self.assertEqual(js_num(0.1), "0.1")
