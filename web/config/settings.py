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

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "nucleo",
    "propostas",
    "painel",
]

MIDDLEWARE = [
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
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
            ],
        },
    },
]

DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["CONN_MAX_AGE"] = 60

# Limite de taxa compartilhado entre processos (ver nucleo/limite.py).
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "cache_limite",
    }
}

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
