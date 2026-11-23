"""Servidor de produção no Windows (waitress), atrás do Caddy.

    .venv\\Scripts\\python servir.py

Escuta em 127.0.0.1:8000 (mude com HOST/PORTA no .env). Só o Caddy fica exposto à internet.
"""

import os

import environ
from django.conf import settings
from waitress import serve

from config.wsgi import application

env = environ.Env()
environ.Env.read_env(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

if __name__ == "__main__":
    if settings.DEBUG:
        # Servidor de produção: com DEBUG=true os erros mostrariam código e configurações a qualquer visitante
        raise SystemExit("servir.py é o servidor de produção: defina DEBUG=false no .env (para testar, use manage.py runserver).")
    serve(application, host=env("HOST", default="127.0.0.1"), port=env.int("PORTA", default=8000),
          threads=env.int("THREADS", default=8), url_scheme="http")
