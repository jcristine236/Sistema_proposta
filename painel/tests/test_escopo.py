"""Isolamento entre empresas e entre autores (revisão da etapa 3)."""

import json

from nucleo.models import Empresa, Membro, Usuario
from nucleo.permissoes import PERFIS
from painel.tests.test_login import SENHA, Base
from propostas.models import Modelo, Proposta
from publico.tests.fabrica import criar_proposta


def jpost(client, url, corpo):
    return client.post(url, json.dumps(corpo), content_type="application/json")


class EscopoUsuariosTest(Base):
    def setUp(self):
        super().setUp()
        self.kolp = Empresa.objects.get(slug="kolp")
        # admin da CADDI (perfil administrador, sem "todas as empresas")
        self.adm = Usuario.objects.create_user("adm@caddi.com", SENHA, nome="Adm", permissoes=PERFIS["administrador"]["permissoes"])
        Membro.objects.create(usuario=self.adm, empresa=self.caddi)
        # usuário só da KOLP e um com acesso a todas as empresas
        self.da_kolp = Usuario.objects.create_user("k@kolp.com", SENHA, nome="K", permissoes=PERFIS["vendedor"]["permissoes"])
        Membro.objects.create(usuario=self.da_kolp, empresa=self.kolp)
        self.global_ = Usuario.objects.create_user("g@x.com", SENHA, nome="G", todas_empresas=True,
                                                   permissoes=PERFIS["vendedor"]["permissoes"])
        # colega da CADDI com mais poder (gerente com propostasDeTodos é subconjunto; usamos permissão extra)
        self.colega = Usuario.objects.create_user("c@caddi.com", SENHA, nome="C", permissoes=PERFIS["vendedor"]["permissoes"])
        Membro.objects.create(usuario=self.colega, empresa=self.caddi)
        self.login(email="adm@caddi.com")

    def test_nao_redefine_senha_de_outra_empresa_nem_global(self):
        for alvo in (self.da_kolp, self.global_):
            r = self.client.post(f"/admin/usuarios/{alvo.pk}/redefinir-senha")
            self.assertNotIn("senha", r.json())
            self.assertTrue(Usuario.objects.get(pk=alvo.pk).check_password(SENHA))

    def test_redefine_senha_de_colega_da_mesma_empresa(self):
        r = self.client.post(f"/admin/usuarios/{self.colega.pk}/redefinir-senha")
        self.assertIn("senha", r.json())

    def test_nao_redefine_senha_de_quem_tem_mais_poder(self):
        self.colega.permissoes = {"modulos": {**PERFIS["administrador"]["permissoes"]["modulos"]}, "propostasDeTodos": True}
        self.colega.save()
        self.adm.permissoes = PERFIS["gerente"]["permissoes"] | {"modulos": {**PERFIS["gerente"]["permissoes"]["modulos"], "usuarios": {"ver": True, "editar": True}}}
        self.adm.save()
        r = self.client.post(f"/admin/usuarios/{self.colega.pk}/redefinir-senha")
        self.assertNotIn("senha", r.json())

    def test_nao_edita_nem_exclui_de_outra_empresa(self):
        r = jpost(self.client, "/admin/usuarios/salvar", {"id": self.da_kolp.pk, "nome": "Hack", "email": "k@kolp.com",
                                                          "ativo": True, "senha": "nova-senha-123", "empresas": [], "permissoes": {}})
        self.assertIn("erro", r.json())
        self.assertEqual(Usuario.objects.get(pk=self.da_kolp.pk).nome, "K")
        self.client.post(f"/admin/usuarios/{self.da_kolp.pk}/excluir")
        self.assertTrue(Usuario.objects.filter(pk=self.da_kolp.pk, ativo=True).exists())

    def test_nao_ve_usuario_de_outra_empresa(self):
        self.assertEqual(self.client.get(f"/admin/usuarios/{self.da_kolp.pk}").status_code, 404)
        self.assertEqual(self.client.get(f"/admin/usuarios/{self.global_.pk}").status_code, 404)
        html = self.client.get("/admin/usuarios").content.decode()
        self.assertNotIn("k@kolp.com", html)
        self.assertNotIn("g@x.com", html)
        self.assertIn("c@caddi.com", html)


class EscopoPropostasTest(Base):
    def setUp(self):
        super().setUp()
        self.p = criar_proposta(cliente="Do Admin")
        self.vendedor()
        self.login(email="vend@x.com")

    def test_vendedor_nao_mexe_na_proposta_de_outro(self):
        pk = self.p.pk
        self.assertEqual(jpost(self.client, f"/admin/propostas/{pk}/editar", {"dados": {}}).json(), {"erros": ["Proposta não encontrada."]})
        self.assertEqual(jpost(self.client, "/admin/propostas/calculo", {"chave": {"proposta": pk}, "dados": {}}).status_code, 404)
        self.assertEqual(jpost(self.client, "/admin/propostas/previa", {"chave": {"proposta": pk}, "dados": {}}).status_code, 404)
        self.assertEqual(self.client.post(f"/admin/propostas/{pk}/contrato").json(), {"erro": "Proposta não encontrada."})
        m = Modelo.objects.get(empresa=self.caddi, tipo_solucao="servidor-nuvem")
        r = self.client.get(f"/admin/propostas/nova/{m.pk}?de={pk}")
        self.assertNotEqual(r.context["config"]["dados"]["cliente"]["nome"], "Do Admin")

    def test_modelo_de_outra_empresa(self):
        m = Modelo.objects.get(empresa__slug="kolp", tipo_solucao="site")
        r = jpost(self.client, f"/admin/propostas/nova/{m.pk}/criar", {"dados": {}})
        self.assertEqual(r.json(), {"erros": ["Modelo não encontrado nesta empresa."]})
        self.assertEqual(jpost(self.client, "/admin/propostas/calculo", {"chave": {"modelo": m.pk}, "dados": {}}).status_code, 404)

    def test_chave_invalida_nao_da_500(self):
        self.assertEqual(jpost(self.client, "/admin/propostas/calculo", {"chave": "x", "dados": {}}).status_code, 404)
        self.assertEqual(Proposta.objects.count(), 1)
