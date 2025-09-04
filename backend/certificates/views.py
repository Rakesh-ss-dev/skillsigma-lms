from rest_framework import viewsets, permissions
from .models import Certificate
from .serializers import CertificateSerializer
from accounts.permissions import IsAdminOrInstructor

class CertificateViewSet(viewsets.ReadOnlyModelViewSet):  # Admin/Instructor view only
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAdminOrInstructor]
