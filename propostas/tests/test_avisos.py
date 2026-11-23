import json
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings

from propostas.avisos import avisar
from publico.tests.fabrica import criar_proposta, semear


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", ADMIN_BASE_URL="https://painel.x/")
class AvisosTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        semear()

    def setUp(self):
        self.p = criar_proposta()
        self.p.autor.email = "autor@x.com"
        self.p.autor.whatsapp = "11999998888"
        self.p.empresa.email_notificacao = "avisos@x.com"
        self.p.empresa.whatsapp_notificacao = "5511999998888"

    def test_sem_smtp_so_log(self):
        with self.assertLogs("propostas.avisos", "INFO"):
            avisar(self.p, "abriu", "texto")
        self.assertEqual(mail.outbox, [])

    @override_settings(SMTP_HOST="smtp.x")
    def test_email_para_autor_e_empresa(self):
        avisar(self.p, "abriu", "Corpo")
        self.assertEqual([m.to for m in mail.outbox], [["autor@x.com"], ["avisos@x.com"]])
        m = mail.outbox[0]
        self.assertEqual(m.subject, f"[{self.p.empresa.nome}] {self.p.codigo} · abriu")
        self.assertIn(f"Acompanhar: https://painel.x/admin/propostas/{self.p.pk}", m.body)
        self.assertTrue(m.body.startswith("Corpo\n\nProposta "))

    @override_settings(SMTP_HOST="smtp.x", WHATSAPP_PROVIDER="webhook", WHATSAPP_WEBHOOK_URL="https://hook.x/w",
                       WHATSAPP_WEBHOOK_SECRET="s")
    def test_whatsapp_webhook_sem_duplicar_numero(self):
        with mock.patch("propostas.avisos.urllib.request.urlopen") as abrir:
            avisar(self.p, "ACEITOU", "c", whatsapp=True)
        self.assertEqual(abrir.call_count, 1)  # mesmo número da empresa e do autor
        req = abrir.call_args[0][0]
        self.assertEqual(req.full_url, "https://hook.x/w")
        corpo = json.loads(req.data)
        self.assertEqual((corpo["para"], corpo["evento"], corpo["proposta"]), ("5511999998888", "ACEITOU", self.p.codigo))
        self.assertEqual(req.get_header("X-webhook-secret"), "s")

    @override_settings(WHATSAPP_PROVIDER="evolution", EVOLUTION_URL="https://evo.x/", EVOLUTION_INSTANCE="a b",
                       EVOLUTION_APIKEY="k")
    def test_falha_nao_derruba(self):
        with mock.patch("propostas.avisos.urllib.request.urlopen", side_effect=OSError("fora")) as abrir, \
                self.assertLogs("propostas.avisos", "ERROR"):
            avisar(self.p, "x", "y", whatsapp=True)
        self.assertEqual(abrir.call_args[0][0].full_url, "https://evo.x/message/sendText/a%20b")
