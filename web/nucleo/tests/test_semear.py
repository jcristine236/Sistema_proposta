from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings

from nucleo.models import Empresa, Membro, Usuario
from propostas.models import Modelo, Produto, Proposta

ENV_OK = {"SEED_ADMIN_EMAIL": "admin@propostas.local", "SEED_ADMIN_PASSWORD": "trocar-esta-senha"}


@override_settings(ALLOW_ANY_HOST=True)
class SemearTest(TestCase):
    def semear(self):
        call_command("semear", verbosity=0)

    def setUp(self):
        self.semear()

    def test_cria_tres_empresas(self):
        e = {x.slug: x for x in Empresa.objects.all()}
        self.assertEqual(set(e), {"caddi", "kolp", "fase"})
        self.assertEqual([e[s].prefixo for s in ("caddi", "kolp", "fase")], ["CAD", "KLP", "FSE"])
        self.assertEqual(e["caddi"].dominio_propostas, "propostas.caddi.com.br")
        self.assertEqual(e["fase"].dominio_propostas, "propostas.fasesistemas.com.br")
        self.assertEqual(e["caddi"].tema["primaria"], "#0D1B3E")
        self.assertEqual(len(e["kolp"].motivos_recusa), 6)

    def test_admin_criado_com_troca_de_senha(self):
        u = Usuario.objects.get(email="admin@propostas.local")
        self.assertTrue(u.super_admin and u.todas_empresas and u.trocar_senha)
        self.assertTrue(u.check_password("trocar-esta-senha"))
        self.assertEqual(u.nome, "Administrador")

    def test_admin_membro_das_tres(self):
        self.assertEqual(Membro.objects.filter(usuario__email="admin@propostas.local").count(), 3)

    def test_modelos_carregados(self):
        self.assertEqual(Modelo.objects.filter(ativo=True).count(), 18)
        tipos = set(Modelo.objects.filter(empresa__slug="caddi").values_list("tipo_solucao", flat=True))
        self.assertEqual(
            tipos,
            {"servidor-nuvem", "gestao-ti", "consultoria-ti", "suporte-gerenciado", "backup-seguranca", "projeto-caddi"},
        )
        nuvem = Produto.objects.get(empresa__slug="caddi", codigo="avancado")
        self.assertEqual(str(nuvem.preco), "1668.00")
        self.assertEqual(nuvem.categoria, "planos-nuvem")

    def test_idempotente(self):
        contagens = (Empresa.objects.count(), Produto.objects.count(), Modelo.objects.count())
        u = Usuario.objects.get(email="admin@propostas.local")
        u.set_password("outra-senha-123")
        u.save()
        Empresa.objects.filter(slug="caddi").update(motivos_recusa=["Só este"])
        self.semear()
        self.assertEqual((Empresa.objects.count(), Produto.objects.count(), Modelo.objects.count()), contagens)
        self.assertTrue(Usuario.objects.get(pk=u.pk).check_password("outra-senha-123"))
        self.assertEqual(Empresa.objects.get(slug="caddi").motivos_recusa, ["Só este"])

    def test_sem_proposta_de_exemplo(self):
        self.assertEqual(Proposta.objects.count(), 0)

    @override_settings(ALLOW_ANY_HOST=False)
    def test_senha_fraca_bloqueada_em_producao(self):
        Usuario.objects.all().delete()
        with self.assertRaises(CommandError):
            self.semear()
