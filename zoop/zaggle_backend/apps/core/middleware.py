from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    """
    Injects company context from authenticated user into every request.

    company_id is NEVER read from request data — it always comes from the
    authenticated user's JWT claim via this middleware.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.company = None
        request.company_id = None
        if hasattr(request, "user") and request.user.is_authenticated:
            request.company = request.user.company
            request.company_id = str(request.user.company_id)
        return self.get_response(request)
