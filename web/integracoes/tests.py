import io
import json
import urllib.error
from unittest import mock

from django.test import TestCase, override_settings

from integracoes import d4sign
from propostas.models import Evento, Proposta
from publico.tests.fabrica import criar_proposta, semear

CFG = {"cofre": "cofre-1", "template": "tpl-1", "signatarioEmail": "assina@empresa.com", "campos": {"razaoSocial": "razao"}}


def resposta(corpo):
    r = mock.MagicMock()
    r.__enter__.return_value.read.return_value = json.dumps(corpo).encode()
    return r


@override_settings(D4SIGN_TOKEN_API="tok", D4SIGN_CRYPT_KEY="ck", D4SIGN_BASE_URL="https://d4.x/api/v1/",
                   D4SIGN_WEBHOOK_TOKEN="segredo")
class D4SignTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        semear()

    def setUp(self):
        self.p = criar_proposta(status="ACEITA")
        self.p.empresa.d4sign = CFG
        self.p.empresa.save()
        self.p.dados_contratacao = {"razaoSocial": "ACME", "email": "cli@acme.com"}
        self.p.save()

    def test_gerar_contrato(self):
        with mock.patch("integracoes.d4sign.urllib.request.urlopen",
                        side_effect=[resposta({"uuid": "doc-9"}), resposta({}), resposta({})]) as abrir:
            c = d4sign.gerar_contrato(self.p.empresa, self.p)
        self.assertEqual((c["uuid"], c["status"], c["signatarios"]), ("doc-9", "ENVIADO", ["cli@acme.com", "assina@empresa.com"]))
        urls = [x[0][0].full_url for x in abrir.call_args_list]
        self.assertEqual(urls[0], "https://d4.x/api/v1/documents/cofre-1/makedocumentbytemplate?tokenAPI=tok&cryptKey=ck")
        self.assertTrue(urls[2].startswith("https://d4.x/api/v1/documents/doc-9/sendtosigner"))
        campos = json.loads(abrir.call_args_list[0][0][0].data)["templates"]["tpl-1"]
        self.assertEqual((campos["razao"], campos["cliente"]), ("ACME", self.p.cliente_nome))

    def test_erro_da_api(self):
        erro = urllib.error.HTTPError("u", 400, "x", {}, io.BytesIO(b'{"message": "cofre inexistente"}'))
        with mock.patch("integracoes.d4sign.urllib.request.urlopen", side_effect=erro):
            with self.assertRaisesMessage(d4sign.D4SignErro, "D4Sign (/documents/cofre-1/makedocumentbytemplate): cofre inexistente"):
                d4sign.gerar_contrato(self.p.empresa, self.p)

    def test_status(self):
        self.assertEqual(d4sign.status_do_webhook({"type_post": "1"}), "ASSINADO")
        self.assertEqual(d4sign.status_do_webhook({"type_post": 3}), "CANCELADO")
        self.assertIsNone(d4sign.status_do_webhook({"type_post": "4"}))
        self.assertEqual(d4sign.status_do_webhook({"message": "Documento finalizado"}), "ASSINADO")

    def test_webhook(self):
        Proposta.objects.filter(pk=self.p.pk).update(contrato={"uuid": "doc-9", "status": "ENVIADO"})
        url = "/api/d4sign/webhook?token=segredo"
        self.assertEqual(self.client.post("/api/d4sign/webhook?token=x", {"uuid": "doc-9", "type_post": "1"}).status_code, 401)
        self.assertEqual(self.client.post(url, "{", content_type="application/json").status_code, 400)
        self.assertEqual(self.client.post(url, {"uuid": "outro", "type_post": "1"}).json(), {"ok": True, "naoEncontrado": True})
        self.assertEqual(self.client.post(url, {"uuid": "doc-9", "type_post": "4"}).json(), {"ok": True, "ignorado": True})
        r = self.client.post(url, {"uuid": "doc-9", "type_post": "1"})
        self.assertEqual(r.json(), {"ok": True})
        p = Proposta.objects.get(pk=self.p.pk)
        self.assertEqual(p.contrato["status"], "ASSINADO")
        self.assertIn("assinadoEm", p.contrato)
        self.client.post(url, json.dumps({"uuid": "doc-9", "type_post": "1"}), content_type="application/json")
        self.assertEqual(Evento.objects.filter(proposta=p, tipo="CONTRATO_ASSINADO").count(), 1)

    def test_botao_do_painel(self):
        from painel.tests.test_login import SENHA
        from nucleo.models import Usuario
        u = Usuario.objects.get(email="admin@propostas.local")
        u.set_password(SENHA)
        u.trocar_senha = False
        u.save()
        self.client.post("/login", {"email": u.email, "senha": SENHA})
        with mock.patch("integracoes.d4sign.urllib.request.urlopen",
                        side_effect=[resposta({"uuid": "doc-7"}), resposta({}), resposta({})]):
            r = self.client.post(f"/admin/propostas/{self.p.pk}/contrato")
        self.assertEqual(r.json(), {"ok": True, "status": "ENVIADO"})
        self.assertEqual(Proposta.objects.get(pk=self.p.pk).contrato["uuid"], "doc-7")


@override_settings(D4SIGN_WEBHOOK_TOKEN="", DEBUG=False)
class WebhookSemTokenTest(TestCase):
    def test_recusa_em_producao(self):
        self.assertEqual(self.client.post("/api/d4sign/webhook", {"uuid": "x", "type_post": "1"}).status_code, 503)
