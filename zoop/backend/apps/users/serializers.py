from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "full_name",
            "role",
            "department",
            "employee_code",
            "manager",
            "is_active",
            "created_at",
        ]
        read_only_fields = ("id", "company", "created_at")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "phone",
            "full_name",
            "role",
            "department",
            "employee_code",
            "manager",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source="manager.full_name", read_only=True)
    reports_count = serializers.IntegerField(source="reports.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "full_name",
            "role",
            "department",
            "employee_code",
            "manager",
            "manager_name",
            "is_active",
            "reports_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "company", "created_at", "updated_at")


class LoginOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    session_token = serializers.CharField()
    otp = serializers.CharField(max_length=6, min_length=6)


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
