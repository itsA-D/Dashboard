import os
import random
import string
import hashlib
import hmac

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.core.exceptions import PolicyViolationError

from .serializers import (
    LoginOTPSerializer,
    VerifyOTPSerializer,
    RefreshTokenSerializer,
    LogoutSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserDetailSerializer,
)
from .models import User
from apps.core.views import TenantViewSet
from apps.audit.mixins import AuditMixin
from apps.core.permissions import IsAuthenticated, IsCompanyAdmin


class OTPStore:
    """In-memory OTP store backed by Redis/Django cache."""

    KEY_PREFIX = "otp"

    @classmethod
    def _key(cls, session_token):
        return f"{cls.KEY_PREFIX}:{session_token}"

    @classmethod
    def create(cls, email):
        session_token = hashlib.sha256(
            f"{email}{settings.OTP_SECRET_KEY}".encode()
            + os.urandom(32)
        ).hexdigest()[:32]
        otp = "".join(random.choices(string.digits, k=6))
        cache.set(
            cls._key(session_token),
            {"otp": otp, "email": email, "attempts": 0},
            timeout=600,  # 10 minutes
        )
        return session_token, otp

    @classmethod
    def get(cls, session_token):
        return cache.get(cls._key(session_token))

    @classmethod
    def invalidate(cls, session_token):
        cache.delete(cls._key(session_token))

    @classmethod
    def increment_attempts(cls, session_token, data):
        data["attempts"] += 1
        cache.set(cls._key(session_token), data, timeout=600)


class LoginOTPView(APIView):
    """Step 1: Request OTP."""

    permission_classes = [AllowAny]
    throttle_classes = []  # Applied at view level via throttle decorator

    def post(self, request):
        serializer = LoginOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        # Check if user exists — we log but still return success to prevent enumeration
        user_exists = User.objects.filter(email=email, is_active=True).exists()
        if not user_exists and settings.DEBUG:
            print(f"[DEV] Warning: OTP requested for non-existent or inactive user: {email}")

        session_token, otp = OTPStore.create(email)

        # In development, print OTP to console
        if settings.DEBUG:
            print(f"========================================")
            print(f"[DEV] OTP for {email}: {otp}")
            print(f"========================================")

        # Send OTP via email
        try:
            send_mail(
                subject="Your Zoop verification code",
                message=f"Your verification code is: {otp}",
                from_email=settings.EMAIL_FROM,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            if settings.DEBUG:
                print(f"[DEV] Email delivery failed: {str(e)}")
            # In production, we still return success to avoid leaking info
            # but the OTP is printed to console in dev mode above

        return Response(
            {"session_token": session_token},
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    """Step 2: Verify OTP and return JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_token = serializer.validated_data["session_token"]
        otp = serializer.validated_data["otp"]

        stored = OTPStore.get(session_token)
        if not stored:
            return Response(
                {"error": {"code": "INVALID_SESSION", "message": "Session expired"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if stored["attempts"] >= 5:
            OTPStore.invalidate(session_token)
            return Response(
                {"error": {"code": "TOO_MANY_ATTEMPTS", "message": "Too many attempts"}},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if stored["otp"] != otp:
            OTPStore.increment_attempts(session_token, stored)
            return Response(
                {"error": {"code": "INVALID_OTP", "message": "Invalid code"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        OTPStore.invalidate(session_token)

        try:
            user = User.objects.get(email=stored["email"], is_active=True)
        except User.DoesNotExist:
            return Response(
                {"error": {"code": "USER_NOT_FOUND", "message": "User not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        refresh = RefreshToken.for_user(user)
        # Embed company_id and role in token claims
        refresh["company_id"] = str(user.company_id)
        refresh["role"] = user.role
        refresh["email"] = user.email

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )


class TokenRefreshView(APIView):
    """Rotate refresh token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }
            )
        except TokenError:
            return Response(
                {"error": {"code": "INVALID_TOKEN", "message": "Invalid refresh token"}},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LogoutView(AuditMixin, APIView):
    """Blacklist refresh token on logout."""

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
            refresh.blacklist()

            # Record security event
            if request.user.is_authenticated:
                self._write_audit(
                    "user.signed_out",
                    request.user,
                    before=self._serialize_instance(request.user),
                    after=None
                )

            return Response({"success": True})
        except TokenError:
            return Response({"success": False}, status=status.HTTP_400_BAD_REQUEST)


class MeView(AuditMixin, APIView):
    """Current user profile — GET/PATCH."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        before = self._serialize_instance(request.user)
        serializer = UserDetailSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Audit profile update
        self._write_audit(
            "user.profile_updated",
            user,
            before=before,
            after=self._serialize_instance(user),
        )

        return Response(serializer.data)


class UserViewSet(AuditMixin, TenantViewSet):
    """User management — admin only for write operations."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action == "retrieve":
            return UserDetailSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsCompanyAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.user.role
        # Employees see only themselves
        if role == "employee":
            return qs.filter(id=self.request.user.id)
        # Managers see their team
        if role == "manager":
            team_ids = self.request.user.reports.values_list("id", flat=True)
            return qs.filter(
                id__in=[*team_ids, self.request.user.id]
            )
        # Finance/Admin see all
        return qs

    def perform_create(self, serializer):
        # Attach company from authenticated user
        user = serializer.save(company=self.request.company)

        # Audit creation
        self._write_audit(
            "user.created",
            user,
            before=None,
            after=self._serialize_instance(user),
        )

    def perform_destroy(self, instance):
        before = self._serialize_instance(instance)
        # Soft delete — deactivate
        instance.is_active = False
        instance.save()

        # Audit deactivation
        self._write_audit(
            "user.deactivated",
            instance,
            before=before,
            after=self._serialize_instance(instance),
        )
