"""Filtros de formatação usados nos templates do painel."""

from django import template

from nucleo import formato

register = template.Library()
register.filter("brl", formato.brl)
register.filter("data_br", formato.data_br)
register.filter("data_hora_br", formato.data_hora_br)
register.filter("duracao", formato.duracao)
register.filter("numero_br", formato.numero_br)
