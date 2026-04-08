from django.urls import path

from .views import CardWebhookView

urlpatterns = [
    path("", CardWebhookView.as_view(), name="card-webhook"),
]
