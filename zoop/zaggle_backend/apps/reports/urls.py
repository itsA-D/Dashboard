from django.urls import path

from .views import ReportGenerateView, ReportDownloadView, DashboardAnalyticsView

urlpatterns = [
    path("analytics/dashboard/", DashboardAnalyticsView.as_view(), name="dashboard-analytics"),
    path("generate/", ReportGenerateView.as_view(), name="report-generate"),
    path("<uuid:pk>/download/", ReportDownloadView.as_view(), name="report-download"),
]
