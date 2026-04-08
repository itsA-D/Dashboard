from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
    NotFound,
    Throttled,
)

ERROR_CODES = {
    "AuthenticationFailed": "AUTH_FAILED",
    "NotAuthenticated": "NOT_AUTHENTICATED",
    "PermissionDenied": "FORBIDDEN",
    "NotFound": "NOT_FOUND",
    "ValidationError": "VALIDATION_ERROR",
    "Throttled": "RATE_LIMITED",
}


def custom_exception_handler(exc, context):
    """Standardised error response envelope."""
    response = exception_handler(exc, context)
    if response is not None:
        error_code = ERROR_CODES.get(exc.__class__.__name__, "ERROR")
        detail = getattr(exc, "detail", str(exc))
        response.data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": detail,
            },
        }
    return response


class PolicyViolationError(Exception):
    """Raised when an expense violates a policy rule."""


class DuplicateExpenseError(Exception):
    """Raised when a potential duplicate expense is detected."""


class CardOperationError(Exception):
    """Raised for invalid card state transitions."""


class ApprovalFlowError(Exception):
    """Raised when approval flow logic fails."""
