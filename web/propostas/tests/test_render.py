"""O HTML da proposta gerado pelo Django tem de ser igual ao do PropostaView (React)."""

from django.test import SimpleTestCase

from nucleo.tema import tema_de
from propostas.render.secoes import renderizar_proposta
from propostas.tests.html_canonico import canonico, primeira_diferenca
from propostas.tests.test_regras import CASOS, EMPRESAS, contexto_do_caso


class RenderTest(SimpleTestCase):
    maxDiff = None

    def test_igual_ao_react(self):
        for c in CASOS:
            with self.subTest(c["nome"]):
                ctx = contexto_do_caso(c)
                html = renderizar_proposta(
                    c["modelo"]["secoes"], ctx, tema_de(EMPRESAS[c["empresa"]]["tema"]),
                    modo=c.get("modo", "publico"), slug="exemplo", decisao=c["decisao"],
                    codigo="KLP-2026-1001" if c["nome"].startswith("sintetico") else "CAD-2026-1001",
                    aviso_previa=c.get("avisoPrevia"),
                )
                self.assertIsNone(primeira_diferenca(canonico(html), canonico(c["html"])))

    def test_escapa_html_dos_textos(self):
        ctx = {"cliente": "<script>x</script>", "empresa": {"nome": "E"}, "calc": {}, "expirada": False}
        secoes = [{"id": "t", "tipo": "texto", "titulo": "{{cliente}} **<b>ok</b>**", "paragrafos": ["<img src=x>"]}]
        html = renderizar_proposta(secoes, ctx, tema_de({}))
        self.assertNotIn("<script>", html)
        self.assertNotIn("<img src=x>", html)
        self.assertIn("&lt;script&gt;", html)
