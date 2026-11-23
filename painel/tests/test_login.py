from django.core.cache import cache
from django.core.management import call_command
from django.test import Client, TestCase, override_settings

from nucleo.models import Empresa, LogAuditoria, Membro, Usuario
from nucleo.permissoes import PERFIS

SENHA = "senha-boa-123"
BLOQUEIO = "Muitas tentativas incorretas. Aguarde 15 minutos e tente novamente."


@override_settings(ALLOW_ANY_HOST=True)
class Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("semear", verbosity=0)
        cls.admin = Usuario.objects.get(email="admin@propostas.local")
        cls.admin.set_password(SENHA)
        cls.admin.trocar_senha = False
        cls.admin.save()
        cls.caddi = Empresa.objects.get(slug="caddi")

    def setUp(self):
        cache.clear()

    def login(self, client=None, email="admin@propostas.local", senha=SENHA, voltar="/admin"):
        return (client or self.client).post("/login", {"email": email, "senha": senha, "voltar": voltar})

    def vendedor(self):
        u = Usuario.objects.create_user("vend@x.com", SENHA, nome="Vend", permissoes=PERFIS["vendedor"]["permissoes"])
        Membro.objects.create(usuario=u, empresa=self.caddi)
        return u


class LoginTest(Base):
    def test_pagina(self):
        r = self.client.get("/login")
        self.assertContains(r, "Entre para criar e acompanhar suas propostas.")
        self.assertContains(r, 'name="voltar" value="/admin"')

    def test_login_ok(self):
        r = self.login()
        self.assertRedirects(r, "/admin", fetch_redirect_response=False)
        self.assertTrue(LogAuditoria.objects.filter(acao="LOGIN", usuario=self.admin).exists())

    def test_login_redireciona_para_conta_quando_trocar_senha(self):
        Usuario.objects.filter(pk=self.admin.pk).update(trocar_senha=True)
        self.assertRedirects(self.login(), "/admin/conta?trocar=1", fetch_redirect_response=False)

    def test_email_normalizado(self):
        self.assertEqual(self.login(email="  Admin@Propostas.LOCAL ").status_code, 302)

    def test_senha_errada_mensagem_generica(self):
        r = self.login(senha="errada-123456")
        self.assertContains(r, "E-mail ou senha incorretos.")
        self.assertTrue(LogAuditoria.objects.filter(acao="LOGIN_FALHOU").exists())
        r = self.login(email="ninguem@x.com")
        self.assertContains(r, "E-mail ou senha incorretos.")
        self.assertTrue(LogAuditoria.objects.filter(descricao="e-mail inexistente: ninguem@x.com").exists())

    def test_bloqueio_apos_5_falhas(self):
        for _ in range(4):
            self.assertContains(self.login(senha="errada-123456"), "E-mail ou senha incorretos.")
        self.assertContains(self.login(senha="errada-123456"), BLOQUEIO)
        self.assertTrue(LogAuditoria.objects.filter(acao="LOGIN_BLOQUEADO").exists())
        self.assertContains(self.login(), BLOQUEIO)  # senha certa, ainda bloqueado

    def test_limite_por_email(self):
        for _ in range(8):
            self.login(email="x@x.com")
        self.assertContains(self.login(email="x@x.com"), BLOQUEIO)

    def test_voltar_externo_ignorado(self):
        for voltar in ("//evil.com", "https://evil.com", "/administrador", "/admin\\evil"):
            self.client.logout()
            cache.clear()
            self.assertRedirects(self.login(voltar=voltar), "/admin", fetch_redirect_response=False)
        self.client.logout()
        self.assertRedirects(self.login(voltar="/admin/propostas?status=ABERTA"), "/admin/propostas?status=ABERTA",
                             fetch_redirect_response=False)

    def test_usuario_inativo_generico(self):
        Usuario.objects.filter(pk=self.admin.pk).update(ativo=False)
        self.assertContains(self.login(), "E-mail ou senha incorretos.")


class SessaoTest(Base):
    def test_admin_sem_login_vai_para_login(self):
        self.assertRedirects(self.client.get("/admin/propostas"), "/login?voltar=/admin/propostas",
                             fetch_redirect_response=False)

    def test_sair_derruba_outras_sessoes(self):
        outro = Client()
        self.login()
        self.login(outro)
        self.assertEqual(outro.get("/admin").status_code, 200)
        self.client.post("/admin/sair")
        self.assertRedirects(outro.get("/admin"), "/login", fetch_redirect_response=False)
        self.assertTrue(LogAuditoria.objects.filter(acao="LOGOUT").exists())

    def test_sem_empresa(self):
        Usuario.objects.create_user("solto@x.com", SENHA, nome="Solto")
        self.login(email="solto@x.com")
        r = self.client.get("/admin")
        self.assertRedirects(r, "/login?erro=sem-empresa", fetch_redirect_response=False)
        r = self.client.get("/login?erro=sem-empresa")
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, "Seu usuário ainda não está vinculado a nenhuma empresa.")

    def test_troca_de_empresa_valida_slug(self):
        self.vendedor()
        self.login(email="vend@x.com")
        self.client.post("/admin/empresa-ativa", {"slug": "kolp"})  # não é membro da KOLP
        self.assertNotEqual(self.client.cookies.get("pp_empresa", None) and self.client.cookies["pp_empresa"].value, "kolp")
        self.login()
        r = self.client.post("/admin/empresa-ativa", {"slug": "kolp"})
        self.assertRedirects(r, "/admin", fetch_redirect_response=False)
        self.assertEqual(self.client.cookies["pp_empresa"].value, "kolp")

    def test_vendedor_sem_permissao_em_usuarios(self):
        self.vendedor()
        self.login(email="vend@x.com")
        self.assertRedirects(self.client.get("/admin/usuarios"), "/admin/sem-permissao", fetch_redirect_response=False)

    def test_troca_de_senha_pendente_prende_na_conta(self):
        Usuario.objects.filter(pk=self.admin.pk).update(trocar_senha=True)
        self.login()
        self.assertRedirects(self.client.get("/admin"), "/admin/conta?trocar=1", fetch_redirect_response=False)
