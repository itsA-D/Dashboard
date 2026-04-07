from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet, ExpensePolicyViewSet

router = DefaultRouter()
router.register("", ExpenseViewSet, basename="expenses")
router.register("policies", ExpensePolicyViewSet, basename="expense-policies")

urlpatterns = [
    path("", include(router.urls)),
]
