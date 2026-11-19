import json

from django.test import Client

from nucleo.models import Empresa, LogAuditoria, Membro, Usuario
from nucleo.permissoes import PERFIS
from painel.tests.test_login import SENHA, Base
from propostas.models import Proposta

SEM = "Você não tem permissão para esta ação."


class UsuariosTest(Base):
    def setUp(self):
        super().setUp()
        self.kolp = Empresa.objects.get(slug="kolp")

    def salvar(self, client=None, **d):
        dados = {"nome": "Fulano", "email": "fulano@x.com", "whatsapp": "", "ativo": True, "superAdmin": False,
                 "todasEmpresas": False, "empresas": [self.caddi.id], "permissoes": PERFIS["vendedor"]["permissoes"], **d}
        r = (client or self.client).post("/admin/usuarios/salvar", json.dumps(dados), content_type="application/json")
        return r, r.json()

    def gerente_usuarios(self):
        """Administrador de empresa (não superadmin), só na CADDI."""
        u = Usuario.objects.create_user("adm@x.com", SENHA, nome="Adm", permissoes=PERFIS["administrador"]["permissoes"])
        Membro.objects.create(usuario=u, empresa=self.caddi)
        return u

    def test_lista(self):
        self.login()
        self.vendedor()
        r = self.client.get("/admin/usuarios")
        self.assertContains(r, "+ Novo usuário")
        self.assertContains(r, "<td>Superadministrador</td>", html=True)
        self.assertContains(r, "<td>Vendedor</td>", html=True)
        self.assertContains(r, '<td class="muted" style="font-size:13px">CADDI</td>', html=True)

    def test_lista_escopo_nao_super(self):
        so_kolp = Usuario.objects.create_user("k@x.com", SENHA, nome="SoKolp")
        Membro.objects.create(usuario=so_kolp, empresa=self.kolp)
        self.gerente_usuarios()
        self.login(email="adm@x.com")
        html = self.client.get("/admin/usuarios").content.decode()
        self.assertNotIn("SoKolp", html)
        self.assertIn("Administrador", html)  # todasEmpresas aparece

    def test_tela_novo_e_existente(self):
        self.login()
        r = self.client.get("/admin/usuarios/novo")
        self.assertContains(r, "<h1 style=\"margin-top:6px\">Novo usuário</h1>", html=True)
        self.assertContains(r, "Senha (vazio = gerar provisória)")
        self.assertContains(r, 'id="dados-usuario"')
        v = self.vendedor()
        r = self.client.get(f"/admin/usuarios/{v.id}")
        self.assertContains(r, "Nova senha (opcional)")
        self.assertContains(r, "Redefinir senha")
        self.assertContains(r, 'data-confirmar="Excluir este usuário?', html=False)
        self.assertEqual(self.client.get("/admin/usuarios/naoexiste").status_code, 404)
        # Não aparece "Excluir" na própria tela
        self.assertNotContains(self.client.get(f"/admin/usuarios/{self.admin.id}"), "data-confirmar")

    def test_criar_com_senha_provisoria(self):
        self.login()
        r, j = self.salvar(whatsapp="+55 (11) 9999-8888", email=" Fulano@X.com ")
        self.assertTrue(j["ok"])
        self.assertRegex(j["senhaTemporaria"], r"^[\w-]{8}9a$")
        u = Usuario.objects.get(id=j["id"])
        self.assertEqual((u.email, u.whatsapp, u.trocar_senha), ("fulano@x.com", "+551199998888", True))
        self.assertTrue(u.check_password(j["senhaTemporaria"]))
        self.assertEqual(list(u.membros.values_list("empresa_id", flat=True)), [self.caddi.id])
        log = LogAuditoria.objects.get(acao="CRIAR", entidade="Usuario")
        self.assertEqual((log.entidade_id, log.descricao, log.empresa_id), (u.id, "fulano@x.com (senha definida)", self.caddi.id))

    def test_validacoes(self):
        self.login()
        for d, msg in [({"nome": " "}, "Informe o nome."),
                       ({"email": "ruim"}, "E-mail inválido."),
                       ({"email": "admin@propostas.local"}, "Já existe um usuário com este e-mail."),
                       ({"empresas": []}, "Escolha pelo menos uma empresa."),
                       ({"senha": "curta1"}, "A senha precisa ter pelo menos 10 caracteres."),
                       ({"id": "naoexiste"}, "Usuário não encontrado."),
                       ({"id": None, "email": "a@b.com", "empresas": ["inventada"]}, "Escolha pelo menos uma empresa.")]:
            self.assertEqual(self.salvar(**d)[1], {"erro": msg})
        self.assertEqual(self.salvar(id=self.admin.id, email=self.admin.email, ativo=False)[1],
                         {"erro": "Você não pode desativar nem rebaixar o próprio acesso."})
        self.assertEqual(self.salvar(id=self.admin.id, email=self.admin.email, superAdmin=False)[1],
                         {"erro": "Você não pode desativar nem rebaixar o próprio acesso."})

    def test_editar_senha_e_sessoes(self):
        self.login()
        _, j = self.salvar()
        u = Usuario.objects.get(id=j["id"])
        versao = u.versao_sessao
        # Mesmo conteúdo: não derruba as sessões
        _, j2 = self.salvar(id=u.id, nome="Outro")
        self.assertEqual(j2, {"ok": True, "id": u.id})
        u.refresh_from_db()
        self.assertEqual((u.nome, u.versao_sessao), ("Outro", versao))
        _, j3 = self.salvar(id=u.id, senha="nova-senha-123")
        u.refresh_from_db()
        self.assertTrue(u.check_password("nova-senha-123"))
        self.assertEqual(u.versao_sessao, versao + 1)
        self.assertTrue(LogAuditoria.objects.filter(acao="EDITAR", entidade="Usuario", descricao="fulano@x.com (senha definida)").exists())

    def test_nao_super_limitado(self):
        self.gerente_usuarios()
        self.login(email="adm@x.com")
        tudo = {"modulos": {"usuarios": {"ver": True, "excluir": True}}, "propostasDeTodos": True}
        _, j = self.salvar(empresas=[self.caddi.id, self.kolp.id], superAdmin=True, todasEmpresas=True, permissoes=tudo)
        u = Usuario.objects.get(id=j["id"])
        self.assertFalse(u.super_admin or u.todas_empresas)
        self.assertEqual(list(u.membros.values_list("empresa_id", flat=True)), [self.caddi.id])
        self.assertEqual(u.permissoes, {"modulos": {"usuarios": {"ver": True, "excluir": True}}, "propostasDeTodos": True})
        # Preserva vínculos com empresas que o editor não enxerga
        Membro.objects.create(usuario=u, empresa=self.kolp)
        self.salvar(id=u.id, empresas=[self.caddi.id])
        self.assertEqual(set(u.membros.values_list("empresa_id", flat=True)), {self.caddi.id, self.kolp.id})
        # Não mexe em superadmin
        self.assertEqual(self.salvar(id=self.admin.id, email=self.admin.email)[1],
                         {"erro": "Apenas um superadministrador pode alterar outro superadministrador."})
        r = self.client.post(f"/admin/usuarios/{self.admin.id}/redefinir-senha")
        self.assertEqual(r.json(), {"erro": "Sem permissão para este usuário."})

    def test_concedente_sem_permissao_de_usuarios(self):
        self.vendedor()
        self.login(email="vend@x.com")
        r, j = self.salvar()
        self.assertEqual((r.status_code, j), (403, {"erro": SEM}))
        self.assertRedirects(self.client.get("/admin/usuarios"), "/admin/sem-permissao", fetch_redirect_response=False)

    def test_permissao_por_acao(self):
        u = Usuario.objects.create_user("ed@x.com", SENHA, nome="Ed", permissoes={"modulos": {"usuarios": {"ver": True, "editar": True}}})
        Membro.objects.create(usuario=u, empresa=self.caddi)
        self.login(email="ed@x.com")
        self.assertEqual(self.salvar()[0].status_code, 403)  # criar
        self.assertRedirects(self.client.get("/admin/usuarios/novo"), "/admin/sem-permissao", fetch_redirect_response=False)
        self.assertEqual(self.client.get(f"/admin/usuarios/{u.id}").status_code, 200)

    def test_redefinir_senha(self):
        v = self.vendedor()
        Usuario.objects.filter(pk=v.pk).update(falhas_login=3)
        sessao = Client()
        self.login(sessao, email="vend@x.com")
        self.login()
        r = self.client.post(f"/admin/usuarios/{v.id}/redefinir-senha")
        senha = r.json()["senha"]
        self.assertRegex(senha, r"^[\w-]{8}7b$")
        v.refresh_from_db()
        self.assertTrue(v.check_password(senha) and v.trocar_senha)
        self.assertEqual(v.falhas_login, 0)
        self.assertEqual(sessao.get("/admin").status_code, 302)  # sessão derrubada
        log = LogAuditoria.objects.get(acao="REDEFINIR_SENHA")
        self.assertEqual((log.entidade_id, log.descricao, log.empresa_id), (v.id, "vend@x.com", None))

    def test_excluir_ou_desativar(self):
        v = self.vendedor()
        self.login()
        r = self.client.post(f"/admin/usuarios/{v.id}/excluir")
        self.assertRedirects(r, "/admin/usuarios", fetch_redirect_response=False)
        self.assertFalse(Usuario.objects.filter(id=v.id).exists())
        self.assertTrue(LogAuditoria.objects.filter(acao="EXCLUIR", entidade="Usuario", descricao="vend@x.com").exists())
        # Com propostas: só desativa
        autor = Usuario.objects.create_user("autor@x.com", SENHA, nome="Autor")
        Proposta.objects.create(empresa=self.caddi, autor=autor, cliente_nome="C", slug="c-teste", codigo="CAD-1", titulo="T", dados={}, snapshot={}, calculo={})
        self.client.post(f"/admin/usuarios/{autor.id}/excluir")
        autor.refresh_from_db()
        self.assertFalse(autor.ativo)
        self.assertTrue(LogAuditoria.objects.filter(acao="DESATIVAR", descricao=f"{autor.email} (tem propostas)").exists())
        # A si mesmo: nada
        self.client.post(f"/admin/usuarios/{self.admin.id}/excluir")
        self.assertTrue(Usuario.objects.filter(id=self.admin.id).exists())
