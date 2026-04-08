from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action

from apps.core.views import TenantViewSet
from apps.core.permissions import IsAuthenticated

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(TenantViewSet):
    """Notification list and management."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["POST"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["POST"])
    def read_all(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({"success": True, "updated": updated})
