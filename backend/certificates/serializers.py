from rest_framework import serializers
from .models import Certificate
from enrollments.serializers import EnrollmentSerializer


class CertificateSerializer(serializers.ModelSerializer):
    enrollment = EnrollmentSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = ["id", "enrollment", "issued_at", "certificate_url"]
