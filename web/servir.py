"""Servidor de produção no Windows (waitress), atrás do Caddy.

    .venv\\Scripts\\python servir.py

Escuta em 127.0.0.1:8000 (mude com HOST/PORTA no web/.env). Só o Caddy fica exposto à internet.
"""

import os

import environ
from waitress import serve

from config.wsgi import application

env = environ.Env()
environ.Env.read_env(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

if __name__ == "__main__":
    serve(application, host=env("HOST", default="127.0.0.1"), port=env.int("PORTA", default=8000),
          threads=env.int("THREADS", default=8), url_scheme="http")
