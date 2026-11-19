import tempfile
from pathlib import Path

from django.test import TestCase, override_settings

from nucleo.models import Empresa
from nucleo.tema import FONTES_URL
from propostas.models import Proposta
from publico.tests.fabrica import criar_proposta, semear


@override_settings(ALLOW_ANY_HOST=True)
class PaginaTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        semear()

    def test_abre(self):
        p = criar_proposta()
        r = self.client.get(f"/p/{p.slug}")
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, "<title>Proposta para Grupo Exemplo Ltda · CADDI</title>", html=False)
        self.assertContains(r, FONTES_URL.replace("&", "&amp;"))
        self.assertContains(r, 'rel="icon" href="/empresas/caddi/logo.png"')
        self.assertContains(r, "/static/css/proposta.css")
        self.assertContains(r, 'class="pp ')
        self.assertContains(r, "Proposta nº CAD-2026-")
        self.assertContains(r, 'name="robots" content="noindex, nofollow"')

    def test_rascunho_404(self):
        p = criar_proposta(status="RASCUNHO")
        self.assertEqual(self.client.get(f"/p/{p.slug}").status_code, 404)

    def test_inexistente_404_texto(self):
        r = self.client.get("/p/nao-existe")
        self.assertEqual(r.status_code, 404)
        self.assertContains(r, "Proposta não encontrada", status_code=404)

    def test_empresa_inativa_404(self):
        p = criar_proposta()
        Empresa.objects.filter(pk=p.empresa_id).update(ativo=False)
        self.assertEqual(self.client.get(f"/p/{p.slug}").status_code, 404)

    @override_settings(ALLOW_ANY_HOST=False)
    def test_host_errado_404_e_certo_200(self):
        p = criar_proposta()
        self.assertEqual(self.client.get(f"/p/{p.slug}", HTTP_HOST="propostas.kolp.com.br").status_code, 404)
        self.assertEqual(self.client.get(f"/p/{p.slug}", HTTP_HOST="propostas.caddi.com.br:443").status_code, 200)
        self.assertEqual(
            self.client.get(f"/p/{p.slug}", HTTP_HOST="x", HTTP_X_FORWARDED_HOST="Propostas.Caddi.com.br, y").status_code, 200
        )

    def test_expira_ao_abrir(self):
        p = criar_proposta(validade="2020-01-15", status="ABERTA")
        r = self.client.get(f"/p/{p.slug}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Proposta.objects.get(pk=p.pk).status, "EXPIRADA")
        self.assertContains(r, "Proposta expirada em 15/01/2020")
        self.assertNotContains(r, "barra-acoes")

    def test_aceita_mostra_aviso(self):
        p = criar_proposta(status="ACEITA")
        self.assertContains(self.client.get(f"/p/{p.slug}"), "Proposta <b>aceita</b>. Obrigado!")


class UploadsTest(TestCase):
    def test_upload_servido(self):
        with tempfile.TemporaryDirectory() as d, override_settings(UPLOAD_DIR=Path(d)):
            nome = "a" * 32 + ".png"
            (Path(d) / nome).write_bytes(b"\x89PNG\r\n\x1a\nxyz")
            r = self.client.get(f"/uploads/{nome}")
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r["Content-Type"], "image/png")
            self.assertEqual(r["Cache-Control"], "public, max-age=31536000, immutable")
            self.assertEqual(r["Content-Security-Policy"], "default-src 'none'; sandbox")
            self.assertEqual(r["X-Content-Type-Options"], "nosniff")
            self.assertEqual(b"".join(r.streaming_content), b"\x89PNG\r\n\x1a\nxyz")

    def test_upload_nome_invalido_404(self):
        for nome in ("../settings.py", "a" * 32 + ".svg", "x.png", "a" * 31 + ".png"):
            self.assertEqual(self.client.get(f"/uploads/{nome}").status_code, 404)

    def test_upload_inexistente_404(self):
        self.assertEqual(self.client.get(f"/uploads/{'b' * 32}.png").status_code, 404)
