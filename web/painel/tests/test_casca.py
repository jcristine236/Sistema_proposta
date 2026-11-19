import re

from django.test import Client

from nucleo.models import LogAuditoria, Usuario
from painel.tests.test_login import SENHA, Base


def rotulos_menu(html: str) -> list[str]:
    nav = re.search(r"<nav>(.*?)</nav>", html, re.S).group(1)
    return re.findall(r"</svg>([^<]+)</a>", nav)


class CascaTest(Base):
    def test_menu_vendedor(self):
        self.vendedor()
        self.login(email="vend@x.com")
        menu = rotulos_menu(self.client.get("/admin").content.decode())
        self.assertEqual(
            menu, ["Painel", "Propostas", "Nova proposta", "Modelos", "Produtos e planos", "Clientes", "Minha conta"]
        )

    def test_menu_admin_e_grupos(self):
        self.login()
        html = self.client.get("/admin").content.decode()
        self.assertIn("Empresas", rotulos_menu(html))
        self.assertEqual(re.findall(r'<div class="grupo">([^<]+)</div>', html), ["Propostas", "Cadastros", "Configurações"])

    def test_menu_com_troca_de_senha_so_mostra_conta(self):
        Usuario.objects.filter(pk=self.admin.pk).update(trocar_senha=True)
        self.login()
        html = self.client.get("/admin/conta?trocar=1").content.decode()
        # Igual ao Next: "Empresas" depende só de superAdmin (Lateral.tsx), por isso continua
        self.assertEqual(rotulos_menu(html), ["Empresas", "Minha conta"])
        Usuario.objects.filter(pk=self.admin.pk).update(super_admin=False)
        self.login()
        self.assertEqual(rotulos_menu(self.client.get("/admin/conta").content.decode()), ["Minha conta"])
        self.assertContains(self.client.get("/admin/conta"), "Por segurança, defina uma senha nova antes de continuar.")

    def test_item_ativo(self):
        self.login()
        from publico.tests.fabrica import criar_proposta
        p = criar_proposta()
        html = self.client.get(f"/admin/propostas/{p.pk}").content.decode()
        self.assertIn('href="/admin/propostas" class="on"', html)
        html = self.client.get("/admin/propostas/nova").content.decode()
        self.assertIn('href="/admin/propostas" class=""', html)
        self.assertIn('href="/admin/propostas/nova" class="on"', html)

    def test_tema_no_app(self):
        self.login()
        self.client.post("/admin/empresa-ativa", {"slug": "kolp"})
        html = self.client.get("/admin").content.decode()
        self.assertIn('<div class="app" style="--primary:#5C026E;', html)
        self.assertIn('src="/empresas/kolp/logo-claro.png"', html)
        self.assertIn("Painel · KOLP", html)

    def test_conta_troca_senha(self):
        Usuario.objects.filter(pk=self.admin.pk).update(trocar_senha=True)
        outro = Client()
        self.login()
        self.login(outro)
        dados = {"nome": "Admin", "whatsapp": "", "senhaAtual": "errada", "novaSenha": "nova-senha-456", "confirmar": "nova-senha-456"}
        self.assertContains(self.client.post("/admin/conta", dados), "Senha atual incorreta.")
        dados["senhaAtual"] = SENHA
        dados["confirmar"] = "outra-coisa-1"
        self.assertContains(self.client.post("/admin/conta", dados), "A confirmação não confere com a nova senha.")
        dados.update(novaSenha=SENHA, confirmar=SENHA)
        self.assertContains(self.client.post("/admin/conta", dados), "A nova senha precisa ser diferente da atual.")
        dados.update(novaSenha="nova-senha-456", confirmar="nova-senha-456")
        r = self.client.post("/admin/conta", dados)
        self.assertContains(r, "Dados e senha atualizados.")
        # Igual ao Next: a tela volta sem a troca obrigatória
        self.assertNotContains(r, "Por segurança, defina uma senha nova")
        self.assertContains(r, "Trocar senha")
        u = Usuario.objects.get(pk=self.admin.pk)
        self.assertFalse(u.trocar_senha)
        self.assertTrue(u.check_password("nova-senha-456"))
        self.assertEqual(self.client.get("/admin").status_code, 200)  # esta sessão continua
        self.assertRedirects(outro.get("/admin"), "/login", fetch_redirect_response=False)  # a outra caiu
        self.assertTrue(LogAuditoria.objects.filter(acao="TROCAR_SENHA").exists())

    def test_conta_so_dados(self):
        self.login()
        r = self.client.post("/admin/conta", {"nome": "Novo Nome", "whatsapp": "(11) 99999-8888"})
        self.assertContains(r, "Dados atualizados.")
        self.assertEqual(Usuario.objects.get(pk=self.admin.pk).whatsapp, "11999998888")

    def test_sem_permissao_pagina(self):
        self.login()
        self.assertContains(self.client.get("/admin/sem-permissao"), "Acesso não permitido")
