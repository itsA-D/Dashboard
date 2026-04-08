from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.core.urls")),
    path("api/v1/auth/", include("apps.users.auth_urls")),
    path("api/v1/companies/", include("apps.companies.urls")),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/expenses/", include("apps.expenses.urls")),
    path("api/v1/cards/", include("apps.cards.urls")),
    path("api/v1/approvals/", include("apps.approvals.urls")),
    path("api/v1/budgets/", include("apps.budgets.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/webhooks/cards/", include("apps.cards.webhook_urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
