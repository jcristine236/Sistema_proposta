"""Empresas (tenants), usuários e registros transversais.

Espelha prisma/schema.prisma. Os campos JSON guardam o mesmo formato do sistema Next.
"""

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

from nucleo.ids import novo_id


def _pk():
    return models.CharField(primary_key=True, max_length=32, default=novo_id, editable=False)


class Empresa(models.Model):
    id = _pk()
    slug = models.SlugField(unique=True, max_length=30)  # caddi, kolp, fase
    nome = models.CharField(max_length=120)
    razao_social = models.CharField(max_length=200, null=True, blank=True)
    site = models.CharField(max_length=200, null=True, blank=True)
    # Domínio dos links públicos (ex.: propostas.caddi.com.br)
    dominio_propostas = models.CharField(max_length=200, unique=True)
    # Paleta e logos. Ver nucleo/tema.py
    tema = models.JSONField(default=dict)
    rodape = models.TextField(null=True, blank=True)
    # Prefixo do número de controle (CAD -> CAD-2026-1001)
    prefixo = models.CharField(max_length=10, unique=True)
    email_notificacao = models.CharField(max_length=160, null=True, blank=True)
    # WhatsApp que recebe os avisos (só números, com DDI)
    whatsapp_notificacao = models.CharField(max_length=20, null=True, blank=True)
    # Config do D4Sign: { cofre, template, signatarioNome, signatarioEmail, campos }
    d4sign = models.JSONField(null=True, blank=True)
    motivos_recusa = models.JSONField(default=list)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        email = (email or "").strip().lower()
        if not email:
            raise ValueError("E-mail obrigatório.")
        usuario = self.model(email=email, **extra)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("super_admin", True)
        extra.setdefault("todas_empresas", True)
        return self.create_user(email, password, **extra)


class Usuario(AbstractBaseUser):
    id = _pk()
    nome = models.CharField(max_length=120)
    email = models.EmailField(max_length=160, unique=True)
    whatsapp = models.CharField(max_length=16, null=True, blank=True)
    # Administrador da plataforma inteira
    super_admin = models.BooleanField(default=False)
    # True = acessa todas as empresas; False = só as vinculadas em Membro
    todas_empresas = models.BooleanField(default=False)
    # Permissões por módulo e ação. Ver nucleo/permissoes.py
    permissoes = models.JSONField(default=dict)
    ativo = models.BooleanField(default=True)
    trocar_senha = models.BooleanField(default=False)
    # Incrementado ao sair/trocar senha/desativar: invalida sessões abertas
    versao_sessao = models.IntegerField(default=0)
    falhas_login = models.IntegerField(default=0)
    bloqueado_ate = models.DateTimeField(null=True, blank=True)
    ultimo_acesso = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    # last_login do Django não é usado (ultimo_acesso cumpre esse papel).
    last_login = None

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    objects = UsuarioManager()

    @property
    def is_active(self):
        return self.ativo

    def __str__(self):
        return self.nome


class Membro(models.Model):
    """Vínculo usuário x empresa (quando o usuário não acessa todas)."""

    id = _pk()
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="membros")
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="membros")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["usuario", "empresa"], name="membro_unico")]


class Upload(models.Model):
    """Imagens enviadas (logos e imagens das seções). Arquivo em UPLOAD_DIR."""

    id = _pk()
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="uploads")
    arquivo = models.CharField(max_length=64, unique=True)
    nome = models.CharField(max_length=200)
    mime = models.CharField(max_length=40)
    tamanho = models.IntegerField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["empresa"])]


class LogAuditoria(models.Model):
    """Quem fez o quê e quando. empresa_id sem FK: o log sobrevive à empresa."""

    id = _pk()
    usuario = models.ForeignKey(
        Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name="auditoria"
    )
    empresa_id = models.CharField(max_length=32, null=True, blank=True)
    acao = models.CharField(max_length=40)
    entidade = models.CharField(max_length=40, null=True, blank=True)
    entidade_id = models.CharField(max_length=64, null=True, blank=True)
    descricao = models.CharField(max_length=500, null=True, blank=True)
    ip = models.CharField(max_length=64, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["criado_em"]),
            models.Index(fields=["empresa_id", "criado_em"]),
        ]
