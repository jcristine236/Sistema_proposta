from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.test import TestCase

from nucleo.models import Empresa, Membro, Usuario
from propostas.models import ContadorProposta, Proposta


def criar_empresa(slug="caddi", prefixo="CAD"):
    return Empresa.objects.create(
        slug=slug, nome=slug.upper(), dominio_propostas=f"propostas.{slug}.com.br",
        prefixo=prefixo, tema={},
    )


def criar_proposta(empresa, autor, codigo="CAD-2026-1001", slug="cliente-abc"):
    return Proposta.objects.create(
        empresa=empresa, autor=autor, codigo=codigo, slug=slug, titulo="T",
        cliente_nome="Cliente", dados={}, snapshot={}, calculo={},
    )


class ModelosTest(TestCase):
    def setUp(self):
        self.empresa = criar_empresa()
        self.usuario = Usuario.objects.create_user("a@b.com", "senha-forte-123", nome="A")

    def test_status_padrao_publicada(self):
        p = criar_proposta(self.empresa, self.usuario)
        self.assertEqual(p.status, "PUBLICADA")

    def test_autor_protegido(self):
        criar_proposta(self.empresa, self.usuario)
        with self.assertRaises(ProtectedError):
            self.usuario.delete()

    def test_membro_unico(self):
        Membro.objects.create(usuario=self.usuario, empresa=self.empresa)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Membro.objects.create(usuario=self.usuario, empresa=self.empresa)

    def test_contador_unico_por_ano(self):
        ContadorProposta.objects.create(empresa=self.empresa, ano=2026, ultimo=1001)
        with self.assertRaises(IntegrityError), transaction.atomic():
            ContadorProposta.objects.create(empresa=self.empresa, ano=2026, ultimo=1)

    def test_status_invalido_barrado_no_banco(self):
        p = criar_proposta(self.empresa, self.usuario)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Proposta.objects.filter(pk=p.pk).update(status="X")

    def test_email_usuario_unico(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Usuario.objects.create_user("a@b.com", "outra-senha-123", nome="B")

    def test_superuser_flags(self):
        u = Usuario.objects.create_superuser("s@b.com", "senha-forte-123", nome="S")
        self.assertTrue(u.super_admin and u.todas_empresas)
