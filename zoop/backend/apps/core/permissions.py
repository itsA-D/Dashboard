from rest_framework.permissions import BasePermission


class IsCompanyAdmin(BasePermission):
    """User has admin role within their company."""

    def has_permission(self, request, view):
        return request.user.role == "admin"


class IsFinanceOrAbove(BasePermission):
    """User has admin or finance role."""

    def has_permission(self, request, view):
        return request.user.role in ("admin", "finance")


class IsManagerOrAbove(BasePermission):
    """User has admin, finance, or manager role."""

    def has_permission(self, request, view):
        return request.user.role in ("admin", "finance", "manager")


class IsAuthenticated(BasePermission):
    """Standard JWT-authenticated user."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class CanApproveExpense(BasePermission):
    """Prevents self-approval — a user cannot approve their own expense."""

    def has_object_permission(self, request, view, obj):
        return (
            request.user.role in ("admin", "finance", "manager")
            and obj.user != request.user
        )


class IsOwnerOrFinance(BasePermission):
    """Employee can access own records; finance/admin can access all."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("admin", "finance"):
            return True
        return getattr(obj, "user", None) == request.user
