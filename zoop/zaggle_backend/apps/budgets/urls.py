from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BudgetViewSet, UtilisationView

router = DefaultRouter()
router.register("", BudgetViewSet, basename="budgets")

urlpatterns = [
    path("utilisation/", UtilisationView.as_view(), name="budget-utilisation"),
    path("", include(router.urls)),
]
