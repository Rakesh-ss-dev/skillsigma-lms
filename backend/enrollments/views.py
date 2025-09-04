from rest_framework import viewsets, permissions
from .models import Enrollment, GroupEnrollment
from .serializers import EnrollmentSerializer, GroupEnrollmentSerializer
from accounts.permissions import IsAdminOrInstructor
from rest_framework_tracking.mixins import LoggingMixin

class EnrollmentViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only

    def perform_create(self, serializer):
        # student should be explicitly assigned
        serializer.save()


class GroupEnrollmentViewSet(LoggingMixin, viewsets.ModelViewSet):
    queryset = GroupEnrollment.objects.all()
    serializer_class = GroupEnrollmentSerializer
    permission_classes = [IsAdminOrInstructor]  # Admin/Instructor only
