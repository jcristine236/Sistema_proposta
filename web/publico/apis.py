"""APIs da página pública: rastreio de leitura e decisão do cliente.

Portadas de src/app/api/rastreio/route.ts e src/app/api/propostas/[slug]/decisao/route.ts.
Sem CSRF (o sendBeacon não manda cabeçalho), como no Next: protegidas por limite de
taxa por IP e pela validação do domínio da empresa.
"""

import json

from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from nucleo.formato import brl
from nucleo.limite import ip_cliente, permitir
from propostas.avisos import avisar
from propostas.models import Contato, Evento, Proposta, StatusProposta, TempoSecao, Visualizacao
from propostas.regras.documentos import cnpj_valido, email_valido, formatar_cnpj, formatar_telefone, telefone_valido
from publico import servico


def _int_entre(v, minimo, maximo) -> bool:
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return False
    return float(v).is_integer() and minimo <= v <= maximo


def _str_ate(v, maximo) -> bool:
    return isinstance(v, str) and len(v) <= maximo


# ----------------------------------------------------------------- rastreio

@csrf_exempt
@require_POST
def rastreio(request):
    if not permitir(f"rastreio:{ip_cliente(request)}", 240, 10 * 60):
        return JsonResponse({"erro": "limite"}, status=429)
    bruto = request.body.decode("utf-8", errors="replace")
    if len(bruto) > 8000:
        return JsonResponse({"erro": "corpo grande demais"}, status=413)
    try:
        corpo = json.loads(bruto)
    except ValueError:
        return JsonResponse({"erro": "corpo inválido"}, status=400)

    # Equipe interna logada no painel não conta como leitura do cliente
    if request.session.get("uid"):
        return JsonResponse({"visualizacaoId": None, "interno": True})
    if not isinstance(corpo, dict):
        return JsonResponse({"erro": "ação inválida"}, status=400)

    if corpo.get("acao") == "abrir" and _str_ate(corpo.get("slug"), 80) and _str_ate(corpo.get("viewerId"), 64):
        return _abrir(request, corpo["slug"], corpo["viewerId"])

    secoes = corpo.get("secoes")
    if (corpo.get("acao") == "tempo" and _str_ate(corpo.get("slug"), 80) and _str_ate(corpo.get("visualizacaoId"), 40)
            and _int_entre(corpo.get("total"), 0, 600) and isinstance(secoes, dict)
            and all(_str_ate(k, 60) and _int_entre(v, 0, 600) for k, v in secoes.items())):
        return _tempo(corpo["slug"], corpo["visualizacaoId"], int(corpo["total"]), {k: int(v) for k, v in secoes.items()})

    return JsonResponse({"erro": "ação inválida"}, status=400)


def _abrir(request, slug, viewer_id):
    p = servico.buscar(request, slug, exigir_empresa_ativa=False)
    if p is None:
        return JsonResponse({"erro": "não encontrada"}, status=404)
    leitor_novo = not Visualizacao.objects.filter(proposta=p, viewer_id=viewer_id).exists()
    v = Visualizacao.objects.create(
        proposta=p, viewer_id=viewer_id,
        user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:300] or None,
        ip=(request.META.get("HTTP_X_FORWARDED_FOR") or "").split(",")[0].strip() or None,
    )
    if not p.primeira_abertura_em:
        campos = {"primeira_abertura_em": timezone.now()}
        if p.status == StatusProposta.PUBLICADA:
            campos["status"] = StatusProposta.ABERTA
        Proposta.objects.filter(pk=p.pk).update(**campos)
        Evento.objects.create(proposta=p, tipo="ABERTA")
        avisar(p, f"{p.cliente_nome} abriu a proposta",
               f"{p.cliente_nome} acabou de abrir a proposta {p.codigo} enviada por {p.autor.nome}.")
    elif leitor_novo:
        Evento.objects.create(proposta=p, tipo="REABERTA", dados={"nome": "novo leitor"})
    return JsonResponse({"visualizacaoId": v.pk})


def _tempo(slug, visualizacao_id, total, secoes):
    v = Visualizacao.objects.select_related("proposta").filter(pk=visualizacao_id, proposta__slug=slug).first()
    if v is None:
        return JsonResponse({"erro": "visualização inválida"}, status=404)
    validas = {s.get("id") for s in (v.proposta.snapshot or {}).get("secoes") or []}
    itens = [(sid, seg) for sid, seg in secoes.items() if sid in validas and seg > 0]
    with transaction.atomic():
        Visualizacao.objects.filter(pk=v.pk).update(tempo_total_seg=F("tempo_total_seg") + total, ultima_atividade=timezone.now())
        for sid, seg in itens:
            ts, criado = TempoSecao.objects.get_or_create(visualizacao=v, secao=sid, defaults={"segundos": seg})
            if not criado:
                TempoSecao.objects.filter(pk=ts.pk).update(segundos=F("segundos") + seg)
    return JsonResponse({"ok": True})


# ----------------------------------------------------------------- decisão

LIMITES = {"nome": 120, "email": 160, "motivo": 120, "texto": 2000, "razaoSocial": 200, "cnpj": 20, "nomeSocio": 120, "whatsapp": 20}


def _ler_corpo(request) -> dict | None:
    try:
        corpo = json.loads(request.body or b"null")
    except ValueError:
        return None
    if not isinstance(corpo, dict) or corpo.get("acao") not in ("aceitar", "recusar", "comentar"):
        return None
    d = {"acao": corpo["acao"]}
    for k, maximo in LIMITES.items():
        v = corpo.get(k, "")
        if v is None or not isinstance(v, str):
            return None
        v = v.strip()
        if len(v) > maximo:
            return None
        d[k] = v
    return d


@csrf_exempt
@require_POST
def decisao(request, slug):
    if not permitir(f"decisao:{ip_cliente(request)}", 20, 10 * 60):
        return JsonResponse({"erro": "Muitas tentativas. Aguarde alguns minutos."}, status=429)
    d = _ler_corpo(request)
    if d is None:
        return JsonResponse({"erro": "Dados inválidos."}, status=400)
    p = servico.buscar(request, slug, exigir_empresa_ativa=False)
    if p is None:
        return JsonResponse({"erro": "Proposta não encontrada."}, status=404)

    if d["acao"] == "comentar":
        if not d["nome"] or not d["texto"]:
            return JsonResponse({"erro": "Informe seu nome e a mensagem."}, status=400)
        Evento.objects.create(proposta=p, tipo="COMENTARIO", dados={"nome": d["nome"], "email": d["email"], "texto": d["texto"]})
        quem = f"{d['nome']} ({d['email']})" if d["email"] else d["nome"]
        avisar(p, f"Novo comentário de {d['nome']}", f'{quem} comentou na proposta de {p.cliente_nome}:\n\n"{d["texto"]}"')
        return JsonResponse({"ok": True})

    agora = timezone.now()
    if p.status == StatusProposta.EXPIRADA or (p.valida_ate and p.valida_ate < agora):
        return JsonResponse({"erro": "Esta proposta expirou. Fale com quem a enviou."}, status=409)
    if p.status in (StatusProposta.ACEITA, StatusProposta.RECUSADA):
        return JsonResponse({"erro": "Esta proposta já foi respondida."}, status=409)

    if d["acao"] == "recusar":
        if not d["nome"]:
            return JsonResponse({"erro": "Informe seu nome."}, status=400)
        if not d["motivo"]:
            return JsonResponse({"erro": "Selecione um motivo."}, status=400)
        Proposta.objects.filter(pk=p.pk).update(status=StatusProposta.RECUSADA, decidida_em=agora, decisao_nome=d["nome"],
                                                motivo_recusa=d["motivo"], comentario_decisao=d["texto"] or None)
        Evento.objects.create(proposta=p, tipo="RECUSADA",
                              dados={"nome": d["nome"], "email": d["email"], "motivo": d["motivo"], "texto": d["texto"]})
        comentario = f'\n\nComentário: "{d["texto"]}"' if d["texto"] else ""
        avisar(p, f"{p.cliente_nome} recusou a proposta", f"{d['nome']} recusou a proposta. Motivo: {d['motivo']}.{comentario}")
        return JsonResponse({"ok": True})

    # Aceite: exige os dados para o contrato
    erros = []
    if not d["razaoSocial"]:
        erros.append("Informe a razão social.")
    if not cnpj_valido(d["cnpj"]):
        erros.append("CNPJ inválido.")
    if not d["nomeSocio"]:
        erros.append("Informe o nome do sócio responsável.")
    if not email_valido(d["email"]):
        erros.append("E-mail inválido.")
    if not telefone_valido(d["whatsapp"]):
        erros.append("WhatsApp inválido (informe DDD + número).")
    if erros:
        return JsonResponse({"erro": " ".join(erros)}, status=400)

    dados = {"razaoSocial": d["razaoSocial"], "cnpj": formatar_cnpj(d["cnpj"]), "nomeSocio": d["nomeSocio"],
             "email": d["email"].lower(), "whatsapp": formatar_telefone(d["whatsapp"])}
    Proposta.objects.filter(pk=p.pk).update(status=StatusProposta.ACEITA, decidida_em=agora, decisao_nome=d["nomeSocio"],
                                            comentario_decisao=d["texto"] or None, dados_contratacao=dados)
    Evento.objects.create(proposta=p, tipo="ACEITA", dados={"nome": d["nomeSocio"], **dados, "texto": d["texto"]})
    if p.contato_id:
        try:
            Contato.objects.filter(pk=p.contato_id).update(razao_social=dados["razaoSocial"], cnpj=dados["cnpj"],
                                                           responsavel=dados["nomeSocio"], email=dados["email"], celular=dados["whatsapp"])
        except Exception:  # noqa: BLE001 — como no Next, falha aqui não impede o aceite
            pass
    linhas = [
        f"Investimento: {brl(p.valor_mensal or 0)}/mês + {brl(p.valor_unico or 0)} único.",
        "",
        "Dados para o contrato:",
        f"Razão social: {dados['razaoSocial']}",
        f"CNPJ: {dados['cnpj']}",
        f"Sócio: {dados['nomeSocio']}",
        f"E-mail: {dados['email']}",
        f"WhatsApp: {dados['whatsapp']}",
        f'\nComentário: "{d["texto"]}"' if d["texto"] else "",
    ]
    avisar(p, f"{p.cliente_nome} ACEITOU a proposta", "\n".join(linhas), whatsapp=True)
    return JsonResponse({"ok": True})

