from django.urls import path

from publico import apis, views

urlpatterns = [
    path("p/<str:slug>", views.proposta),
    path("uploads/<str:arquivo>", views.upload),
    path("api/rastreio", apis.rastreio),
    path("api/propostas/<str:slug>/decisao", apis.decisao),
    path("api/d4sign/webhook", apis.d4sign_webhook),
]
