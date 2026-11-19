"""Cadastros, modelos de proposta, propostas e rastreamento.

Espelha prisma/schema.prisma. Os JSON (campos, secoes, precificacao, dados, snapshot,
calculo, contrato...) mantêm o formato do sistema Next.
"""

from django.db import models

from nucleo.ids import novo_id
from nucleo.models import Empresa, Usuario


def _pk():
    return models.CharField(primary_key=True, max_length=32, default=novo_id, editable=False)


class Recorrencia(models.TextChoices):
    MENSAL = "MENSAL"
    UNICO = "UNICO"


class StatusProposta(models.TextChoices):
    RASCUNHO = "RASCUNHO", "Rascunho"
    PUBLICADA = "PUBLICADA", "Enviada"
    ABERTA = "ABERTA", "Aberta"
    ACEITA = "ACEITA", "Aceita"
    RECUSADA = "RECUSADA", "Recusada"
    EXPIRADA = "EXPIRADA", "Expirada"


class Contato(models.Model):
    id = _pk()
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="contatos")
    # Nome da empresa cliente (ex.: Grupo Mofarrej)
    organizacao = models.CharField(max_length=200)
    razao_social = models.CharField(max_length=200, null=True, blank=True)
    cnpj = models.CharField(max_length=20, null=True, blank=True)
    responsavel = models.CharField(max_length=120, null=True, blank=True)
    email = models.CharField(max_length=160, null=True, blank=True)
    celular = models.CharField(max_length=20, null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["empresa"])]


class Produto(models.Model):
    id = _pk()
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="produtos")
    # Agrupa os itens de um mesmo campo do formulário (ex.: planos-nuvem)
    categoria = models.CharField(max_length=60)
    codigo = models.CharField(max_length=60, null=True, blank=True)
    nome = models.CharField(max_length=120)
    descricao = models.CharField(max_length=300, null=True, blank=True)
    preco = models.DecimalField(max_digits=12, decimal_places=2)
    recorrencia = models.CharField(max_length=10, choices=Recorrencia.choices, default=Recorrencia.MENSAL)
    # Atributos livres (ex.: {"vcpu": 16, "ram": 92, "disco": 1000})
    atributos = models.JSONField(default=dict)
    ordem = models.IntegerField(default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["empresa", "categoria"])]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(recorrencia__in=Recorrencia.values), name="produto_recorrencia_valida"
            )
        ]


class Modelo(models.Model):
    """Modelo de proposta (tipo de solução): formulário + seções + cálculo."""

    id = _pk()
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="modelos")
    nome = models.CharField(max_length=120)
    descricao = models.CharField(max_length=300, null=True, blank=True)
    # Identificador do tipo de solução (ex.: servidor-nuvem). Único por convenção.
    tipo_solucao = models.CharField(max_length=60)
    campos = models.JSONField(default=list)
    secoes = models.JSONField(default=list)
    precificacao = models.JSONField(default=dict)
    validade_dias = models.IntegerField(default=15)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["empresa"])]


class SecaoModelo(models.Model):
    """Seção salva para reaproveitar em vários modelos ("Minhas seções")."""

    id = _pk()
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="secoes")
    nome = models.CharField(max_length=120)
    descricao = models.CharField(max_length=300, null=True, blank=True)
    secao = models.JSONField()
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["empresa"])]


class ContadorProposta(models.Model):
    """Sequência do número de controle por empresa e ano. Ver propostas/numeracao.py."""

    id = models.BigAutoField(primary_key=True)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="contadores")
    ano = models.IntegerField()
    ultimo = models.IntegerField(default=0)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["empresa", "ano"], name="contador_empresa_ano")]


class Proposta(models.Model):
    id = _pk()
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="propostas")
    # Número de controle exibido (ex.: CAD-2026-1001)
    codigo = models.CharField(max_length=30, unique=True)
    modelo = models.ForeignKey(
        Modelo, null=True, blank=True, on_delete=models.SET_NULL, related_name="propostas"
    )
    autor = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name="propostas")
    contato = models.ForeignKey(
        Contato, null=True, blank=True, on_delete=models.SET_NULL, related_name="propostas"
    )
    # Parte final do link público: /p/{slug}
    slug = models.SlugField(max_length=80, unique=True)
    titulo = models.CharField(max_length=300)
    cliente_nome = models.CharField(max_length=200)
    dados = models.JSONField()
    # Cópia de campos/seções/precificação/catálogo no momento do envio
    snapshot = models.JSONField()
    calculo = models.JSONField()
    valor_mensal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_unico = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valida_ate = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=StatusProposta.choices, default=StatusProposta.PUBLICADA)
    desconto_acima_limite = models.BooleanField(default=False)
    publicada_em = models.DateTimeField(auto_now_add=True)
    primeira_abertura_em = models.DateTimeField(null=True, blank=True)
    decidida_em = models.DateTimeField(null=True, blank=True)
    decisao_nome = models.TextField(null=True, blank=True)
    motivo_recusa = models.TextField(null=True, blank=True)
    comentario_decisao = models.TextField(null=True, blank=True)
    # Dados enviados pelo cliente no aceite
    dados_contratacao = models.JSONField(null=True, blank=True)
    # Contrato no D4Sign: { uuid, status, enviadoEm, assinadoEm, signatarios }
    contrato = models.JSONField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["empresa", "status"])]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=StatusProposta.values), name="proposta_status_valido"
            )
        ]


class Visualizacao(models.Model):
    """Uma sessão de leitura de um leitor (viewer_id fica no navegador dele)."""

    id = _pk()
    proposta = models.ForeignKey(Proposta, on_delete=models.CASCADE, related_name="visualizacoes")
    viewer_id = models.CharField(max_length=64)
    user_agent = models.CharField(max_length=300, null=True, blank=True)
    ip = models.CharField(max_length=64, null=True, blank=True)
    iniciada_em = models.DateTimeField(auto_now_add=True)
    ultima_atividade = models.DateTimeField(auto_now_add=True)
    tempo_total_seg = models.IntegerField(default=0)

    class Meta:
        indexes = [models.Index(fields=["proposta"])]


class TempoSecao(models.Model):
    """Tempo acumulado de leitura por seção, dentro de uma visualização."""

    id = _pk()
    visualizacao = models.ForeignKey(Visualizacao, on_delete=models.CASCADE, related_name="secoes")
    secao = models.CharField(max_length=60)
    segundos = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["visualizacao", "secao"], name="tempo_secao_unico")
        ]


class Evento(models.Model):
    """Linha do tempo: CRIADA, ABERTA, ACEITA, RECUSADA, COMENTARIO..."""

    id = _pk()
    proposta = models.ForeignKey(Proposta, on_delete=models.CASCADE, related_name="eventos")
    tipo = models.CharField(max_length=30)
    dados = models.JSONField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["proposta", "criado_em"])]
