from rest_framework import serializers

from .models import Company, CompanySettings


class CompanySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySettings
        fields = "__all__"
        read_only_fields = ("id", "company", "created_at", "updated_at")


class CompanySerializer(serializers.ModelSerializer):
    settings = CompanySettingsSerializer(read_only=True)

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class CompanyDetailSerializer(serializers.ModelSerializer):
    settings = CompanySettingsSerializer(read_only=True)
    user_count = serializers.IntegerField(read_only=True)
    card_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")
