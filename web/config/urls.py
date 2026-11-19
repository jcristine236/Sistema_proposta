from django.urls import include, path

urlpatterns = [
    path("", include("publico.urls")),
    path("", include("painel.urls")),
]
