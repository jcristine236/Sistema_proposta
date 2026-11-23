"""Páginas da casca do painel: início, sem-permissão e as rotas ainda não migradas."""

from django.shortcuts import render

from nucleo.auth import exige_sessao


@exige_sessao()
def inicio(request):
    # Os KPIs do painel entram na etapa 3; por enquanto só o topo.
    return render(request, "painel/inicio.html")


@exige_sessao(permitir_troca_senha=True)
def sem_permissao(request):
    return render(request, "painel/sem_permissao.html")


def em_construcao(modulo: str, titulo: str):
    """Rota do menu que ainda será migrada (etapas 3 e 4): já respeita a permissão."""

    @exige_sessao(modulo)
    def view(request, *args, **kwargs):
        return render(request, "painel/em_construcao.html", {"titulo": titulo})

    return view
