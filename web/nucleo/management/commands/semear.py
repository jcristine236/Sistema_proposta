"""Dados iniciais: as 3 empresas, o administrador, os catálogos e os 18 modelos.

Pode rodar mais de uma vez: empresas, produtos e modelos são atualizados pelo
identificador; o administrador e os motivos de recusa só são gravados na criação.

    python manage.py semear
"""

import json
import os
import re
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from nucleo.models import Empresa, Membro, Usuario
from propostas.models import Modelo, Produto, Recorrencia
from seed.empresas import EMPRESAS, MOTIVOS

PASTA_MODELOS = Path(settings.BASE_DIR) / "seed" / "modelos"
SENHA_PADRAO = "trocar-esta-senha"


class Command(BaseCommand):
    help = "Cria/atualiza empresas, administrador, catálogos e modelos de proposta."

    def handle(self, *args, **opts):
        email = os.environ.get("SEED_ADMIN_EMAIL", "admin@propostas.local").strip().lower()
        senha = os.environ.get("SEED_ADMIN_PASSWORD", SENHA_PADRAO)
        producao = not settings.ALLOW_ANY_HOST
        fraca = senha == SENHA_PADRAO or len(senha) < 12 or not re.search(r"\d", senha) or not re.search(r"[a-z]", senha, re.I)
        if producao and fraca and not Usuario.objects.filter(email=email).exists():
            raise CommandError("Em produção, defina SEED_ADMIN_PASSWORD no .env com 12+ caracteres, letras e números.")

        with transaction.atomic():
            admin = Usuario.objects.filter(email=email).first()
            if admin is None:
                # Primeiro acesso obriga a trocar a senha
                admin = Usuario.objects.create_superuser(email, senha, nome="Administrador", trocar_senha=True)

            empresas = {}
            for dados in EMPRESAS:
                dados = dict(dados)
                slug = dados.pop("slug")
                empresa, _ = Empresa.objects.update_or_create(
                    slug=slug, defaults=dados, create_defaults={**dados, "motivos_recusa": MOTIVOS}
                )
                Membro.objects.get_or_create(usuario=admin, empresa=empresa)
                empresas[slug] = empresa

            arquivos = sorted(PASTA_MODELOS.glob("*.json"))
            for arquivo in arquivos:
                item = json.loads(arquivo.read_text(encoding="utf-8"))
                empresa = empresas[item["empresa"]]
                if item.get("catalogo"):
                    self._produtos(empresa, item["catalogo"])
                self._modelo(empresa, item["modelo"])

        if opts.get("verbosity", 1) > 0:
            self.stdout.write(f"Seed concluído: {len(empresas)} empresas, {len(arquivos)} modelos. Login: {email}")

    def _produtos(self, empresa, catalogo):
        categoria = catalogo["categoria"]
        for i, p in enumerate(catalogo["itens"]):
            Produto.objects.update_or_create(
                empresa=empresa,
                categoria=categoria,
                codigo=p["codigo"],
                defaults={
                    "nome": p["nome"],
                    "preco": p["preco"],
                    "atributos": p["atributos"],
                    "ordem": i,
                    "recorrencia": Recorrencia.MENSAL,
                    "descricao": p["descricao"],
                },
            )

    def _modelo(self, empresa, m):
        # Casa por tipo_solucao (único por empresa): renomear atualiza no lugar.
        Modelo.objects.update_or_create(
            empresa=empresa,
            tipo_solucao=m["tipoSolucao"],
            defaults={
                "nome": m["nome"],
                "descricao": m.get("descricao"),
                "validade_dias": m.get("validadeDias", 15),
                "campos": m["campos"],
                "secoes": m["secoes"],
                "precificacao": m["precificacao"],
            },
        )
