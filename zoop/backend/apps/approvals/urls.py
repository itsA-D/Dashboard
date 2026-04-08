from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ApprovalFlowViewSet, ApprovalQueueView

router = DefaultRouter()
router.register("flows", ApprovalFlowViewSet, basename="approval-flows")

urlpatterns = [
    path("queue/", ApprovalQueueView.as_view(), name="approval-queue"),
    path("", include(router.urls)),
]
