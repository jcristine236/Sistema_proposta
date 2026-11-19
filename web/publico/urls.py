from django.urls import path

from publico import views

urlpatterns = [
    path("p/<str:slug>", views.proposta),
    path("uploads/<str:arquivo>", views.upload),
]
