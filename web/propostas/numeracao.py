"""Número de controle das propostas: {PREFIXO}-{ANO}-{NNNN}, começando em 1001.

A sequência é por empresa e por ano (no fuso de Brasília) e sai de um único
comando SQL atômico, então propostas criadas ao mesmo tempo nunca repetem número.
"""

from datetime import datetime

from django.db import connection
from django.utils import timezone

from propostas.models import ContadorProposta

PRIMEIRO = 1001

_SQL = f"""
INSERT INTO {ContadorProposta._meta.db_table} (empresa_id, ano, ultimo)
VALUES (%s, %s, {PRIMEIRO})
ON CONFLICT (empresa_id, ano)
DO UPDATE SET ultimo = {ContadorProposta._meta.db_table}.ultimo + 1
RETURNING ultimo
"""


def proximo_codigo(empresa, agora: datetime | None = None) -> str:
    ano = timezone.localtime(agora or timezone.now()).year
    with connection.cursor() as cur:
        cur.execute(_SQL, [empresa.pk, ano])
        numero = cur.fetchone()[0]
    return f"{empresa.prefixo}-{ano}-{numero:04d}"
