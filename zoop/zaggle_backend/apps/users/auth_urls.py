from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginOTPView,
    VerifyOTPView,
    LogoutView,
    MeView,
)

urlpatterns = [
    path("login/", LoginOTPView.as_view(), name="login-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
