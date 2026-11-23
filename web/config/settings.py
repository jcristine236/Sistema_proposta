"""Configuração do sistema de propostas (Django).

Tudo que muda entre máquinas vem de web/.env (veja .env.example).
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)

# O host de cada proposta é validado contra o domínio da empresa (ver publico/),
# por isso aqui todos os hosts são aceitos.
ALLOWED_HOSTS = ["*"]

ALLOW_ANY_HOST = env.bool("ALLOW_ANY_HOST", default=False)
MODO_HTTP = env.bool("MODO_HTTP", default=False)
PUBLIC_BASE_URL = env("PUBLIC_BASE_URL", default="")
PUBLIC_PROTOCOL = env("PUBLIC_PROTOCOL", default="https")
ADMIN_BASE_URL = env("ADMIN_BASE_URL", default="")
UPLOAD_DIR = (BASE_DIR / env("UPLOAD_DIR", default="./uploads")).resolve()

# Atrás do Caddy (HTTPS no proxy, waitress em http://127.0.0.1): confia no X-Forwarded-Proto
# para o Django saber que a requisição original era HTTPS (cookies seguros e checagem de CSRF).
if env.bool("ATRAS_DE_PROXY", default=not MODO_HTTP):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# D4Sign: credenciais da conta (o cofre, o modelo e o signatário ficam por empresa)
D4SIGN_AMBIENTE = env("D4SIGN_AMBIENTE", default="sandbox").lower()
D4SIGN_TOKEN_API = env("D4SIGN_TOKEN_API", default="")
D4SIGN_CRYPT_KEY = env("D4SIGN_CRYPT_KEY", default="")
D4SIGN_WEBHOOK_TOKEN = env("D4SIGN_WEBHOOK_TOKEN", default="")
D4SIGN_BASE_URL = env("D4SIGN_BASE_URL", default="")

# Avisos por e-mail (sem SMTP_HOST, o aviso só vai para o log) — src/lib/email.ts
SMTP_HOST = env("SMTP_HOST", default="")
EMAIL_HOST = SMTP_HOST
EMAIL_PORT = env.int("SMTP_PORT", default=587)
EMAIL_USE_SSL = env.bool("SMTP_SECURE", default=False)
EMAIL_USE_TLS = not EMAIL_USE_SSL and EMAIL_PORT == 587
EMAIL_HOST_USER = env("SMTP_USER", default="")
EMAIL_HOST_PASSWORD = env("SMTP_PASS", default="")
EMAIL_TIMEOUT = 10
DEFAULT_FROM_EMAIL = env("SMTP_FROM", default="") or EMAIL_HOST_USER or "webmaster@localhost"

# Avisos por WhatsApp: "evolution", "meta" ou "webhook" (vazio = só log) — src/lib/whatsapp.ts
WHATSAPP_PROVIDER = env("WHATSAPP_PROVIDER", default="")
EVOLUTION_URL = env("EVOLUTION_URL", default="")
EVOLUTION_INSTANCE = env("EVOLUTION_INSTANCE", default="")
EVOLUTION_APIKEY = env("EVOLUTION_APIKEY", default="")
META_TOKEN = env("META_TOKEN", default="")
META_PHONE_ID = env("META_PHONE_ID", default="")
META_TEMPLATE = env("META_TEMPLATE", default="")
META_TEMPLATE_LANG = env("META_TEMPLATE_LANG", default="pt_BR")
WHATSAPP_WEBHOOK_URL = env("WHATSAPP_WEBHOOK_URL", default="")
WHATSAPP_WEBHOOK_SECRET = env("WHATSAPP_WEBHOOK_SECRET", default="")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "nucleo",
    "propostas",
    "painel",
    "publico",
]

MIDDLEWARE = [
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "nucleo.seguranca.CabecalhosMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "nucleo.auth.SessaoMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.template.context_processors.csrf",
                "painel.context_processors.painel",
            ],
            "builtins": ["painel.templatetags.painel"],
        },
    },
]

DATABASES = {"default": env.db("DATABASE_URL")}
# Nome do banco de testes configurável (permite rodar duas suítes ao mesmo tempo)
if env("TEST_DB_NAME", default=""):
    DATABASES["default"]["TEST"] = {"NAME": env("TEST_DB_NAME")}
DATABASES["default"]["CONN_MAX_AGE"] = 60

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
# Serve /empresas/... (logos) direto da raiz, como o public/ do Next.
WHITENOISE_ROOT = BASE_DIR / "publico_raiz"

SESSION_COOKIE_NAME = "pp_sessao"
SESSION_COOKIE_AGE = 12 * 60 * 60
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not MODO_HTTP
CSRF_COOKIE_SECURE = not MODO_HTTP
CSRF_COOKIE_SAMESITE = "Lax"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "nucleo.Usuario"
PASSWORD_HASHERS = ["django.contrib.auth.hashers.PBKDF2PasswordHasher"]

